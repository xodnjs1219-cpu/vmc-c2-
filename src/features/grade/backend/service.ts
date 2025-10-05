import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import { gradeErrorCodes, type GradeServiceError } from './error';
import type {
  GradesResponse,
  CourseGrade,
  SubmissionGrade,
} from './schema';

/**
 * Get Grades
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @returns Grades response or error
 */
export async function getGrades(
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<GradesResponse, GradeServiceError, unknown>> {
  // 1. 수강 중인 코스 목록 조회
  const { data: enrollments, error: enrollmentError } = await client
    .from('enrollments')
    .select('course_id, courses(id, title)')
    .eq('learner_id', userId);

  if (enrollmentError) {
    return failure(
      500,
      gradeErrorCodes.databaseError,
      '성적을 불러오는 중 오류가 발생했습니다',
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return success({ courses: [] });
  }

  // 2. 코스 ID 추출
  const courseIds = enrollments.map((e) => e.course_id);

  // 3. 제출물 조회 (과제 정보 포함)
  const { data: submissions, error: submissionError } = await client
    .from('submissions')
    .select(
      `
      id,
      assignment_id,
      status,
      score,
      feedback,
      is_late,
      submitted_at,
      graded_at,
      assignments!inner(
        id,
        course_id,
        title,
        weight,
        due_date
      )
    `,
    )
    .eq('learner_id', userId)
    .in('assignments.course_id', courseIds)
    .order('assignments.due_date', { ascending: false });

  if (submissionError) {
    return failure(
      500,
      gradeErrorCodes.databaseError,
      '성적을 불러오는 중 오류가 발생했습니다',
    );
  }

  // 4. 코스별로 그룹화 및 총점 계산
  const courseMap = new Map<string, CourseGrade>();

  // 코스 초기화
  enrollments.forEach((enrollment) => {
    const course = enrollment.courses as unknown as { id: string; title: string };
    if (course) {
      courseMap.set(course.id, {
        courseId: course.id,
        courseTitle: course.title,
        totalScore: 0,
        submissions: [],
      });
    }
  });

  // 제출물 추가 및 총점 계산
  (submissions ?? []).forEach((submission: any) => {
    const assignment = submission.assignments;
    const courseId = assignment.course_id;

    const submissionGrade: SubmissionGrade = {
      submissionId: submission.id,
      assignmentId: submission.assignment_id,
      assignmentTitle: assignment.title,
      assignmentWeight: assignment.weight,
      assignmentDueDate: assignment.due_date,
      status: submission.status,
      score: submission.score,
      feedback: submission.feedback,
      isLate: submission.is_late,
      submittedAt: submission.submitted_at,
      gradedAt: submission.graded_at,
    };

    const courseGrade = courseMap.get(courseId);
    if (courseGrade) {
      courseGrade.submissions.push(submissionGrade);

      // 채점 완료된 과제만 총점 계산
      if (submission.status === 'graded' && submission.score !== null) {
        courseGrade.totalScore += (submission.score * assignment.weight) / 100;
      }
    }
  });

  // 5. 응답 조립
  const courses = Array.from(courseMap.values());

  return success({ courses });
}
