import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '@/backend/http/result';
import { success, failure } from '@/backend/http/result';
import { courseErrorCodes } from './error';
import type {
  CourseListQuery,
  Course,
  CourseListResponse,
} from './schema';

// ========================================
// getCourses - 코스 목록 조회
// ========================================

export async function getCourses(
  client: SupabaseClient,
  query: CourseListQuery
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
        categories!inner(id, name),
        difficulties!inner(id, name, level),
        profiles!inner(id, name)
      `,
        { count: 'exact' }
      )
      .eq('status', status || 'published');

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

    // Transform data
    const courses: Course[] = coursesData.map((course) => ({
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
      instructor: {
        id: (course.profiles as any).id,
        name: (course.profiles as any).name,
      },
      enrollmentCount: enrollmentCountMap.get(course.id) || 0,
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
        categories!inner(id, name),
        difficulties!inner(id, name, level),
        profiles!inner(id, name)
      `
      )
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      return failure(courseErrorCodes.courseNotFound, 'Course not found');
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
        id: (courseData.profiles as any).id,
        name: (courseData.profiles as any).name,
      },
      enrollmentCount: enrollmentCount || 0,
      isEnrolled,
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
