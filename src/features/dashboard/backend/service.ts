import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import { differenceInDays } from 'date-fns';
import {
  DashboardResponseSchema,
  type DashboardResponse,
  type DashboardCourse,
  type UpcomingAssignment,
  type RecentFeedback,
} from './schema';
import { dashboardErrorCodes, type DashboardServiceError } from './error';

const UPCOMING_DEADLINE_DAYS = 7;
const MAX_RECENT_FEEDBACK = 5;

export const getDashboardData = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<DashboardResponse, DashboardServiceError, unknown>> => {
  try {
    // 1. Get my courses with category and difficulty
    const { data: coursesData, error: coursesError } = await client
      .from('enrollments')
      .select(
        `
        enrolled_at,
        courses (
          id,
          title,
          description,
          categories (name),
          difficulties (name)
        )
      `,
      )
      .eq('learner_id', userId)
      .eq('courses.status', 'published');

    if (coursesError) {
      return failure(
        500,
        dashboardErrorCodes.fetchFailed,
        '코스 목록 조회에 실패했습니다',
        coursesError,
      );
    }

    // 2. Get progress for each course
    const courseIds =
      coursesData
        ?.map((e: any) => e.courses?.id)
        .filter((id): id is string => Boolean(id)) ?? [];

    const progressMap = new Map<string, { completed: number; total: number }>();

    if (courseIds.length > 0) {
      // Get total assignments per course
      const { data: totalAssignments } = await client
        .from('assignments')
        .select('course_id, id')
        .in('course_id', courseIds)
        .eq('status', 'published');

      const totalMap = new Map<string, number>();
      totalAssignments?.forEach((a: any) => {
        totalMap.set(a.course_id, (totalMap.get(a.course_id) ?? 0) + 1);
      });

      // Get completed assignments per course
      const { data: completedSubmissions } = await client
        .from('submissions')
        .select('assignment_id, assignments!inner(course_id)')
        .eq('learner_id', userId)
        .eq('status', 'graded')
        .in('assignments.course_id', courseIds);

      const completedMap = new Map<string, number>();
      completedSubmissions?.forEach((s: any) => {
        const courseId = s.assignments.course_id;
        completedMap.set(courseId, (completedMap.get(courseId) ?? 0) + 1);
      });

      // Build progress map
      courseIds.forEach((courseId) => {
        const total = totalMap.get(courseId) ?? 0;
        const completed = completedMap.get(courseId) ?? 0;
        progressMap.set(courseId, { completed, total });
      });
    }

    // 3. Get upcoming assignments (due within 7 days, not submitted)
    const { data: upcomingData, error: upcomingError } = await client
      .from('assignments')
      .select(
        `
        id,
        title,
        due_date,
        course_id,
        courses!inner(title, enrollments!inner(learner_id))
      `,
      )
      .eq('status', 'published')
      .eq('courses.enrollments.learner_id', userId)
      .gte('due_date', new Date().toISOString())
      .lte(
        'due_date',
        new Date(
          Date.now() + UPCOMING_DEADLINE_DAYS * 24 * 60 * 60 * 1000,
        ).toISOString(),
      )
      .order('due_date', { ascending: true });

    if (upcomingError) {
      return failure(
        500,
        dashboardErrorCodes.fetchFailed,
        '마감 임박 과제 조회에 실패했습니다',
        upcomingError,
      );
    }

    // Filter out already submitted assignments
    const upcomingAssignmentIds = upcomingData?.map((a: any) => a.id) ?? [];
    let submittedAssignmentIds: string[] = [];

    if (upcomingAssignmentIds.length > 0) {
      const { data: submittedData } = await client
        .from('submissions')
        .select('assignment_id')
        .eq('learner_id', userId)
        .in('assignment_id', upcomingAssignmentIds);

      submittedAssignmentIds = submittedData?.map((s) => s.assignment_id) ?? [];
    }

    const upcomingAssignments: UpcomingAssignment[] =
      upcomingData
        ?.filter((a: any) => !submittedAssignmentIds.includes(a.id))
        .map((a: any) => ({
          id: a.id,
          title: a.title,
          courseId: a.course_id,
          courseTitle: a.courses.title,
          dueDate: a.due_date,
          daysRemaining: differenceInDays(new Date(a.due_date), new Date()),
        })) ?? [];

    // 4. Get recent feedback (top 5, graded, with feedback)
    const { data: feedbackData, error: feedbackError } = await client
      .from('submissions')
      .select(
        `
        id,
        assignment_id,
        score,
        feedback,
        graded_at,
        assignments!inner(title)
      `,
      )
      .eq('learner_id', userId)
      .eq('status', 'graded')
      .not('feedback', 'is', null)
      .order('graded_at', { ascending: false })
      .limit(MAX_RECENT_FEEDBACK);

    if (feedbackError) {
      return failure(
        500,
        dashboardErrorCodes.fetchFailed,
        '최근 피드백 조회에 실패했습니다',
        feedbackError,
      );
    }

    const recentFeedback: RecentFeedback[] =
      feedbackData?.map((f: any) => ({
        id: f.id,
        assignmentId: f.assignment_id,
        assignmentTitle: f.assignments.title,
        score: f.score,
        feedback: f.feedback,
        gradedAt: f.graded_at,
      })) ?? [];

    // 5. Build courses with progress
    const courses: DashboardCourse[] =
      coursesData
        ?.filter((e: any) => e.courses)
        .map((e: any) => {
          const courseId = e.courses.id;
          const progress = progressMap.get(courseId) ?? {
            completed: 0,
            total: 0,
          };
          const percentage =
            progress.total === 0
              ? 0
              : Math.round((progress.completed / progress.total) * 10000) / 100;

          return {
            id: courseId,
            title: e.courses.title,
            description: e.courses.description,
            category: e.courses.categories.name,
            difficulty: e.courses.difficulties.name,
            enrolledAt: e.enrolled_at,
            progress: {
              completed: progress.completed,
              total: progress.total,
              percentage,
            },
          };
        }) ?? [];

    // 6. Validate and return
    const response = {
      courses,
      upcomingAssignments,
      recentFeedback,
    };

    const parsed = DashboardResponseSchema.safeParse(response);

    if (!parsed.success) {
      return failure(
        500,
        dashboardErrorCodes.validationError,
        '대시보드 데이터 검증에 실패했습니다',
        parsed.error.format(),
      );
    }

    return success(parsed.data);
  } catch (error) {
    return failure(
      500,
      dashboardErrorCodes.fetchFailed,
      '대시보드 데이터 조회 중 오류가 발생했습니다',
      error,
    );
  }
};
