import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '@/backend/http/result';
import { success, failure } from '@/backend/http/result';
import { courseErrorCodes } from './error';
import type {
  CourseListQuery,
  Course,
  CourseListResponse,
  CreateCourseRequest,
  CreateCourseResponse,
  UpdateCourseRequest,
  UpdateCourseStatusRequest,
} from './schema';

// ========================================
// getCourses - 코스 목록 조회
// ========================================

export async function getCourses(
  client: SupabaseClient,
  query: CourseListQuery,
  userId?: string,
  userRole?: string
): Promise<Result<CourseListResponse>> {
  try {
    const { search, categoryId, difficultyId, status, sortBy, sortOrder, page, limit } = query;
    const offset = (page - 1) * limit;

    // Base query
    let coursesQuery = client
      .from('courses')
      .select(
        `
        id,
        title,
        description,
        curriculum,
        status,
        created_at,
        updated_at,
        category_id,
        difficulty_id,
        instructor_id,
        categories(id, name),
        difficulties(id, name, level)
      `,
        { count: 'exact' }
      );

    // Status filter: instructor는 자신의 모든 코스 볼 수 있음, 일반 사용자는 published만
    if (status) {
      coursesQuery = coursesQuery.eq('status', status);
    } else if (userRole === 'instructor' && userId) {
      // Instructor는 자신의 모든 코스 + 다른 사람의 published 코스 볼 수 있음
      coursesQuery = coursesQuery.or(`instructor_id.eq.${userId},status.eq.published`);
    } else {
      // 일반 사용자는 published만
      coursesQuery = coursesQuery.eq('status', 'published');
    }

    // Search filter
    if (search) {
      coursesQuery = coursesQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Category filter
    if (categoryId) {
      coursesQuery = coursesQuery.eq('category_id', categoryId);
    }

    // Difficulty filter
    if (difficultyId) {
      coursesQuery = coursesQuery.eq('difficulty_id', difficultyId);
    }

    // Sorting
    if (sortBy === 'latest') {
      coursesQuery = coursesQuery.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'popular') {
      // For popularity, we'll need to join with enrollments and count
      // For now, fallback to created_at
      coursesQuery = coursesQuery.order('created_at', { ascending: sortOrder === 'asc' });
    }

    // Pagination
    coursesQuery = coursesQuery.range(offset, offset + limit - 1);

    const { data: coursesData, error: coursesError, count } = await coursesQuery;

    if (coursesError) {
      return failure(courseErrorCodes.fetchFailed, coursesError.message);
    }

    if (!coursesData) {
      return success({
        courses: [],
        total: 0,
        page,
        limit,
      });
    }

    // Get enrollment counts for each course
    const courseIds = coursesData.map((c) => c.id);
    const { data: enrollmentCounts } = await client
      .from('enrollments')
      .select('course_id')
      .in('course_id', courseIds);

    const enrollmentCountMap = new Map<string, number>();
    enrollmentCounts?.forEach((e) => {
      enrollmentCountMap.set(e.course_id, (enrollmentCountMap.get(e.course_id) || 0) + 1);
    });

    // Get instructor profiles
    const instructorIds = [...new Set(coursesData.map((c) => c.instructor_id))];
    const { data: instructors } = await client
      .from('profiles')
      .select('id, name')
      .in('id', instructorIds);

    const instructorMap = new Map<string, { id: string; name: string }>();
    instructors?.forEach((instructor) => {
      instructorMap.set(instructor.id, { id: instructor.id, name: instructor.name });
    });

    // Transform data
    const courses: Course[] = coursesData
      .filter((course) => instructorMap.has(course.instructor_id))
      .map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        curriculum: course.curriculum,
        status: course.status as 'draft' | 'published' | 'archived',
        category: {
          id: (course.categories as any).id,
          name: (course.categories as any).name,
        },
        difficulty: {
          id: (course.difficulties as any).id,
          name: (course.difficulties as any).name,
          level: (course.difficulties as any).level,
        },
        instructor: instructorMap.get(course.instructor_id)!,
        enrollmentCount: enrollmentCountMap.get(course.id) || 0,
        isInstructor: userId ? course.instructor_id === userId : false,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
      }));

    const totalPages = Math.ceil((count || 0) / limit);

    return success({
      courses,
      total: count || 0,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return failure(
      courseErrorCodes.fetchFailed,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ========================================
// getCourseById - 코스 상세 조회
// ========================================

export async function getCourseById(
  client: SupabaseClient,
  courseId: string,
  userId?: string
): Promise<Result<Course>> {
  try {
    const { data: courseData, error: courseError } = await client
      .from('courses')
      .select(
        `
        id,
        title,
        description,
        curriculum,
        status,
        created_at,
        updated_at,
        category_id,
        difficulty_id,
        instructor_id,
        categories(id, name),
        difficulties(id, name, level)
      `
      )
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      return failure(courseErrorCodes.courseNotFound, 'Course not found');
    }

    // Get instructor info from profiles table
    const { data: instructorData } = await client
      .from('profiles')
      .select('id, name')
      .eq('id', courseData.instructor_id)
      .single();

    if (!instructorData) {
      return failure(courseErrorCodes.fetchFailed, 'Instructor profile not found');
    }

    // Check if course is published (unless user is the instructor)
    if (courseData.status !== 'published' && courseData.instructor_id !== userId) {
      return failure(courseErrorCodes.courseNotPublished, 'Course is not published');
    }

    // Get enrollment count
    const { count: enrollmentCount } = await client
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    // Check if user is enrolled
    let isEnrolled = false;
    if (userId) {
      const { data: enrollmentData } = await client
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('learner_id', userId)
        .single();

      isEnrolled = !!enrollmentData;
    }

    // Check if user is the instructor
    const isInstructor = userId ? courseData.instructor_id === userId : false;

    const course: Course = {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description,
      curriculum: courseData.curriculum,
      status: courseData.status as 'draft' | 'published' | 'archived',
      category: {
        id: (courseData.categories as any).id,
        name: (courseData.categories as any).name,
      },
      difficulty: {
        id: (courseData.difficulties as any).id,
        name: (courseData.difficulties as any).name,
        level: (courseData.difficulties as any).level,
      },
      instructor: {
        id: instructorData.id,
        name: instructorData.name,
      },
      enrollmentCount: enrollmentCount || 0,
      isEnrolled,
      isInstructor,
      createdAt: courseData.created_at,
      updatedAt: courseData.updated_at,
    };

    return success(course);
  } catch (error) {
    return failure(
      courseErrorCodes.fetchFailed,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ========================================
// createCourse - 코스 생성 (Instructor)
// ========================================

export async function createCourse(
  client: SupabaseClient,
  instructorId: string,
  request: CreateCourseRequest
): Promise<Result<CreateCourseResponse>> {
  try {
    // Validate category and difficulty exist and are active
    const { data: category } = await client
      .from('categories')
      .select('id')
      .eq('id', request.categoryId)
      .eq('is_active', true)
      .single();

    if (!category) {
      return failure(courseErrorCodes.categoryNotFound, '유효한 카테고리를 선택하세요');
    }

    const { data: difficulty } = await client
      .from('difficulties')
      .select('id')
      .eq('id', request.difficultyId)
      .eq('is_active', true)
      .single();

    if (!difficulty) {
      return failure(courseErrorCodes.difficultyNotFound, '유효한 난이도를 선택하세요');
    }

    // Insert course
    const { data: courseData, error: courseError } = await client
      .from('courses')
      .insert({
        instructor_id: instructorId,
        title: request.title,
        description: request.description,
        category_id: request.categoryId,
        difficulty_id: request.difficultyId,
        curriculum: request.curriculum || null,
        status: 'draft',
      })
      .select('id, title, status')
      .single();

    if (courseError || !courseData) {
      return failure(courseErrorCodes.createFailed, '코스 생성에 실패했습니다');
    }

    return success({
      id: courseData.id,
      title: courseData.title,
      status: courseData.status as 'draft' | 'published' | 'archived',
    });
  } catch (error) {
    return failure(
      courseErrorCodes.createFailed,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ========================================
// updateCourse - 코스 수정 (Instructor)
// ========================================

export async function updateCourse(
  client: SupabaseClient,
  instructorId: string,
  courseId: string,
  request: UpdateCourseRequest
): Promise<Result<Course>> {
  try {
    // Check ownership
    const { data: existingCourse } = await client
      .from('courses')
      .select('id, instructor_id')
      .eq('id', courseId)
      .single();

    if (!existingCourse) {
      return failure(courseErrorCodes.courseNotFound, '코스를 찾을 수 없습니다');
    }

    if (existingCourse.instructor_id !== instructorId) {
      return failure(courseErrorCodes.forbidden, '권한이 없습니다');
    }

    // Validate category if provided
    if (request.categoryId) {
      const { data: category } = await client
        .from('categories')
        .select('id')
        .eq('id', request.categoryId)
        .eq('is_active', true)
        .single();

      if (!category) {
        return failure(courseErrorCodes.categoryNotFound, '유효한 카테고리를 선택하세요');
      }
    }

    // Validate difficulty if provided
    if (request.difficultyId) {
      const { data: difficulty } = await client
        .from('difficulties')
        .select('id')
        .eq('id', request.difficultyId)
        .eq('is_active', true)
        .single();

      if (!difficulty) {
        return failure(courseErrorCodes.difficultyNotFound, '유효한 난이도를 선택하세요');
      }
    }

    // Build update object
    const updateData: Record<string, any> = {};
    if (request.title !== undefined) updateData.title = request.title;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.categoryId !== undefined) updateData.category_id = request.categoryId;
    if (request.difficultyId !== undefined) updateData.difficulty_id = request.difficultyId;
    if (request.curriculum !== undefined) updateData.curriculum = request.curriculum;
    updateData.updated_at = new Date().toISOString();

    // Update course
    const { error: updateError } = await client
      .from('courses')
      .update(updateData)
      .eq('id', courseId);

    if (updateError) {
      return failure(courseErrorCodes.updateFailed, '코스 수정에 실패했습니다');
    }

    // Fetch updated course
    return getCourseById(client, courseId, instructorId);
  } catch (error) {
    return failure(
      courseErrorCodes.updateFailed,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ========================================
// updateCourseStatus - 코스 상태 변경 (Instructor)
// ========================================

export async function updateCourseStatus(
  client: SupabaseClient,
  instructorId: string,
  courseId: string,
  request: UpdateCourseStatusRequest
): Promise<Result<Course>> {
  try {
    // Check ownership
    const { data: existingCourse } = await client
      .from('courses')
      .select('id, instructor_id, status')
      .eq('id', courseId)
      .single();

    if (!existingCourse) {
      return failure(courseErrorCodes.courseNotFound, '코스를 찾을 수 없습니다');
    }

    if (existingCourse.instructor_id !== instructorId) {
      return failure(courseErrorCodes.forbidden, '권한이 없습니다');
    }

    // Optional: Validate draft -> published transition (requires at least 1 assignment)
    // Uncomment if this business rule is needed
    /*
    if (existingCourse.status === 'draft' && request.status === 'published') {
      const { count: assignmentCount } = await client
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      if (assignmentCount === 0) {
        return failure(
          courseErrorCodes.invalidStatus,
          '최소 1개의 과제를 추가한 후 공개하세요'
        );
      }
    }
    */

    // Update status
    const { error: updateError } = await client
      .from('courses')
      .update({
        status: request.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId);

    if (updateError) {
      return failure(courseErrorCodes.updateFailed, '코스 상태 변경에 실패했습니다');
    }

    // Fetch updated course
    return getCourseById(client, courseId, instructorId);
  } catch (error) {
    return failure(
      courseErrorCodes.updateFailed,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
