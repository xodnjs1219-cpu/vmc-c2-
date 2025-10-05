import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '@/backend/http/result';
import { failure, success } from '@/backend/http/result';
import { assignmentErrorCodes } from './error';
import type {
  AssignmentDetail,
  AssignmentRow,
  SubmissionRow,
  SubmissionStatus,
} from './schema';

/**
 * Get Assignment Detail
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @param courseId - Course ID
 * @param assignmentId - Assignment ID
 * @returns Assignment detail or error
 */
export async function getAssignmentDetail(
  client: SupabaseClient,
  userId: string,
  courseId: string,
  assignmentId: string,
): Promise<Result<AssignmentDetail, string>> {
  // 1. 수강 확인
  const { data: enrollment, error: enrollmentError } = await client
    .from('enrollments')
    .select('id')
    .eq('learner_id', userId)
    .eq('course_id', courseId)
    .single();

  if (enrollmentError || !enrollment) {
    return failure(
      assignmentErrorCodes.notEnrolled,
      '수강 중인 코스의 과제만 열람할 수 있습니다',
    );
  }

  // 2. Assignment 조회
  const { data: assignment, error: assignmentError } = await client
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .eq('course_id', courseId)
    .single();

  if (assignmentError || !assignment) {
    return failure(assignmentErrorCodes.notFound, '과제를 찾을 수 없습니다');
  }

  const assignmentRow = assignment as AssignmentRow;

  // 3. published 상태 확인
  if (assignmentRow.status !== 'published') {
    return failure(
      assignmentErrorCodes.notPublished,
      '아직 공개되지 않은 과제입니다',
    );
  }

  // 4. 제출물 조회
  const { data: submission } = await client
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('learner_id', userId)
    .maybeSingle();

  const submissionRow = submission as SubmissionRow | null;

  // 5. 제출 가능 여부 판단
  const now = new Date();
  const dueDate = new Date(assignmentRow.due_date);
  const isLate = now > dueDate;

  let canSubmit = true;
  let submitDisabledReason: string | undefined;

  // 이미 제출했고 재제출 요청 상태가 아니면 제출 불가
  if (submissionRow && submissionRow.status !== 'resubmission_required') {
    canSubmit = false;
    submitDisabledReason = '이미 제출한 과제입니다';
  }
  // 마감일 지났고 지각 허용 안되면 제출 불가
  else if (isLate && !assignmentRow.allow_late) {
    canSubmit = false;
    submitDisabledReason = '마감일이 지나 제출할 수 없습니다';
  }

  // 6. 제출 상태 정보 조립
  const submissionStatus: SubmissionStatus | null = submissionRow
    ? {
        id: submissionRow.id,
        status: submissionRow.status,
        textContent: submissionRow.text_content,
        link: submissionRow.link,
        score: submissionRow.score,
        feedback: submissionRow.feedback,
        submittedAt: submissionRow.submitted_at,
        gradedAt: submissionRow.graded_at,
        isLate: submissionRow.is_late,
      }
    : null;

  // 7. 응답 조립
  const detail: AssignmentDetail = {
    id: assignmentRow.id,
    courseId: assignmentRow.course_id,
    title: assignmentRow.title,
    description: assignmentRow.description,
    dueDate: assignmentRow.due_date,
    weight: assignmentRow.weight,
    allowLate: assignmentRow.allow_late,
    allowResubmission: assignmentRow.allow_resubmission,
    status: assignmentRow.status,
    canSubmit,
    isLate,
    submitDisabledReason,
    submission: submissionStatus,
    createdAt: assignmentRow.created_at,
    updatedAt: assignmentRow.updated_at,
  };

  return success(detail);
}
