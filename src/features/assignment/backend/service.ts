import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '@/backend/http/result';
import { failure, success } from '@/backend/http/result';
import { assignmentErrorCodes, submissionErrorCodes } from './error';
import type {
  AssignmentDetail,
  AssignmentRow,
  SubmissionRow,
  SubmissionStatus,
  SubmitAssignmentRequest,
  SubmitAssignmentResponse,
  ResubmitAssignmentRequest,
  ResubmitAssignmentResponse,
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

/**
 * Submit Assignment
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @param request - Submit assignment request
 * @returns Submission response or error
 */
export async function submitAssignment(
  client: SupabaseClient,
  userId: string,
  request: SubmitAssignmentRequest,
): Promise<Result<SubmitAssignmentResponse, string>> {
  // 1. Assignment 조회
  const { data: assignment, error: assignmentError } = await client
    .from('assignments')
    .select('*, courses!inner(id)')
    .eq('id', request.assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return failure(
      submissionErrorCodes.assignmentNotFound,
      '과제를 찾을 수 없습니다',
    );
  }

  const assignmentRow = assignment as AssignmentRow & {
    courses: { id: string };
  };

  // 2. 수강 여부 확인
  const { data: enrollment, error: enrollmentError } = await client
    .from('enrollments')
    .select('id')
    .eq('learner_id', userId)
    .eq('course_id', assignmentRow.course_id)
    .single();

  if (enrollmentError || !enrollment) {
    return failure(
      submissionErrorCodes.notEnrolled,
      '수강 중인 코스의 과제만 제출할 수 있습니다',
    );
  }

  // 3. Assignment 상태 검증
  if (assignmentRow.status === 'draft') {
    return failure(
      submissionErrorCodes.assignmentNotPublished,
      '공개되지 않은 과제는 제출할 수 없습니다',
    );
  }

  if (assignmentRow.status === 'closed') {
    if (!assignmentRow.allow_late) {
      return failure(
        submissionErrorCodes.assignmentClosed,
        '마감된 과제는 제출할 수 없습니다',
      );
    }
  }

  // 4. 중복 제출 확인
  const { data: existingSubmission } = await client
    .from('submissions')
    .select('id, status')
    .eq('assignment_id', request.assignmentId)
    .eq('learner_id', userId)
    .maybeSingle();

  if (
    existingSubmission &&
    existingSubmission.status !== 'resubmission_required'
  ) {
    return failure(
      submissionErrorCodes.alreadySubmitted,
      '이미 제출한 과제입니다',
    );
  }

  // 5. 마감일 검증
  const now = new Date();
  const dueDate = new Date(assignmentRow.due_date);
  const isLate = now > dueDate;

  if (isLate && !assignmentRow.allow_late) {
    return failure(
      submissionErrorCodes.deadlinePassed,
      '마감일이 지나 제출할 수 없습니다',
    );
  }

  // 6. Submission 생성
  const { data: newSubmission, error: insertError } = await client
    .from('submissions')
    .insert({
      assignment_id: request.assignmentId,
      learner_id: userId,
      text_content: request.textContent,
      link: request.link ?? null,
      is_late: isLate,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !newSubmission) {
    return failure(
      submissionErrorCodes.databaseError,
      '제출 중 오류가 발생했습니다',
    );
  }

  const submissionRow = newSubmission as SubmissionRow;

  // 7. 응답 반환
  const response: SubmitAssignmentResponse = {
    id: submissionRow.id,
    assignmentId: submissionRow.assignment_id,
    status: submissionRow.status as 'submitted',
    textContent: submissionRow.text_content,
    link: submissionRow.link,
    isLate: submissionRow.is_late,
    submittedAt: submissionRow.submitted_at,
  };

  return success(response);
}

/**
 * Resubmit Assignment
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @param request - Resubmit assignment request
 * @returns Resubmission response or error
 */
export async function resubmitAssignment(
  client: SupabaseClient,
  userId: string,
  request: ResubmitAssignmentRequest,
): Promise<Result<ResubmitAssignmentResponse, string>> {
  // 1. Submission 조회
  const { data: submission, error: submissionError } = await client
    .from('submissions')
    .select('*, assignments!inner(*)')
    .eq('id', request.submissionId)
    .single();

  if (submissionError || !submission) {
    return failure(
      submissionErrorCodes.submissionNotFound,
      '제출물을 찾을 수 없습니다',
    );
  }

  const submissionRow = submission as SubmissionRow & {
    assignments: AssignmentRow;
  };

  // 2. 소유권 확인
  if (submissionRow.learner_id !== userId) {
    return failure(
      submissionErrorCodes.unauthorized,
      '본인의 제출물만 재제출할 수 있습니다',
    );
  }

  // 3. Assignment 재제출 허용 여부 확인
  if (!submissionRow.assignments.allow_resubmission) {
    return failure(
      submissionErrorCodes.resubmissionNotAllowed,
      '재제출이 허용되지 않는 과제입니다',
    );
  }

  // 4. Submission 상태 확인
  if (submissionRow.status !== 'resubmission_required') {
    return failure(
      submissionErrorCodes.resubmissionNotRequired,
      '재제출이 필요하지 않은 상태입니다',
    );
  }

  // 5. Submission 업데이트
  const { data: updatedSubmission, error: updateError } = await client
    .from('submissions')
    .update({
      text_content: request.textContent,
      link: request.link ?? null,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      score: null,
      feedback: null,
      graded_at: null,
    })
    .eq('id', request.submissionId)
    .select()
    .single();

  if (updateError || !updatedSubmission) {
    return failure(
      submissionErrorCodes.databaseError,
      '재제출 중 오류가 발생했습니다',
    );
  }

  const updatedRow = updatedSubmission as SubmissionRow;

  // 6. 응답 반환
  const response: ResubmitAssignmentResponse = {
    id: updatedRow.id,
    assignmentId: updatedRow.assignment_id,
    status: updatedRow.status as 'submitted',
    textContent: updatedRow.text_content,
    link: updatedRow.link,
    isLate: updatedRow.is_late,
    submittedAt: updatedRow.submitted_at,
  };

  return success(response);
}
