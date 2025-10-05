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

/**
 * Get Course Assignments for Learner
 */
export async function getLearnerCourseAssignments(
  client: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<Result<import('./schema').LearnerAssignmentListResponse, string>> {
  // 1. Check enrollment
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

  // 2. Get published assignments
  const { data: assignments, error: assignmentsError } = await client
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .eq('status', 'published')
    .order('due_date', { ascending: true });

  if (assignmentsError) {
    return failure(assignmentErrorCodes.databaseError, '과제 목록 조회에 실패했습니다');
  }

  if (!assignments || assignments.length === 0) {
    return success({ assignments: [], total: 0 });
  }

  // 3. Get user's submissions for these assignments
  const assignmentIds = assignments.map((a) => a.id);
  const { data: submissions } = await client
    .from('submissions')
    .select('assignment_id, status, score')
    .eq('learner_id', userId)
    .in('assignment_id', assignmentIds);

  const submissionMap = new Map<
    string,
    { status: 'submitted' | 'graded' | 'resubmission_required'; score: number | null }
  >();
  submissions?.forEach((s) => {
    submissionMap.set(s.assignment_id, {
      status: s.status as 'submitted' | 'graded' | 'resubmission_required',
      score: s.score,
    });
  });

  // 4. Transform data
  const now = new Date();
  const assignmentList = assignments.map((assignment) => {
    const dueDate = new Date(assignment.due_date);
    const isLate = now > dueDate;
    const submission = submissionMap.get(assignment.id);

    return {
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.due_date,
      weight: assignment.weight,
      status: assignment.status as 'draft' | 'published' | 'closed',
      allowLate: assignment.allow_late,
      isLate,
      hasSubmitted: !!submission,
      submissionStatus: submission?.status || null,
      score: submission?.score || null,
      createdAt: assignment.created_at,
    };
  });

  return success({
    assignments: assignmentList,
    total: assignmentList.length,
  });
}

// ========================================
// Instructor Functions
// ========================================

import type {
  CreateAssignmentRequest,
  CreateAssignmentResponse,
  UpdateAssignmentRequest,
  UpdateAssignmentStatusRequest,
  SubmissionFilterQuery,
  SubmissionListResponse,
  AssignmentListResponse,
  InstructorAssignmentDetail,
} from './schema';

/**
 * Get Assignment Detail (Instructor)
 */
export async function getInstructorAssignmentDetail(
  client: SupabaseClient,
  instructorId: string,
  assignmentId: string,
): Promise<Result<InstructorAssignmentDetail, string>> {
  // 1. Check ownership and get assignment
  const { data: assignment, error: assignmentError } = await client
    .from('assignments')
    .select('*, courses!inner(instructor_id, id)')
    .eq('id', assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return failure(assignmentErrorCodes.assignmentNotFound, '과제를 찾을 수 없습니다');
  }

  const instructorIdFromCourse = (assignment.courses as any).instructor_id;
  if (instructorIdFromCourse !== instructorId) {
    return failure(assignmentErrorCodes.unauthorized, '권한이 없습니다');
  }

  const courseId = (assignment.courses as any).id;

  // 2. Get submission count
  const { count: submissionCount } = await client
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId);

  // 3. Get total enrolled students count
  const { count: totalStudents } = await client
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  // 4. Transform data
  const detail: InstructorAssignmentDetail = {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.due_date,
    weight: assignment.weight,
    allowLate: assignment.allow_late,
    allowResubmission: assignment.allow_resubmission,
    status: assignment.status as 'draft' | 'published' | 'closed',
    submissionCount: submissionCount || 0,
    totalStudents: totalStudents || 0,
    createdAt: assignment.created_at,
    updatedAt: assignment.updated_at,
  };

  return success(detail);
}

/**
 * Get Course Assignments (Instructor)
 */
export async function getCourseAssignments(
  client: SupabaseClient,
  instructorId: string,
  courseId: string,
): Promise<Result<AssignmentListResponse, string>> {
  // 1. Check course ownership
  const { data: course, error: courseError } = await client
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    return failure(assignmentErrorCodes.courseNotFound, '코스를 찾을 수 없습니다');
  }

  if (course.instructor_id !== instructorId) {
    return failure(assignmentErrorCodes.unauthorized, '권한이 없습니다');
  }

  // 2. Get assignments
  const { data: assignments, error: assignmentsError } = await client
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('due_date', { ascending: false });

  if (assignmentsError) {
    return failure(assignmentErrorCodes.databaseError, '과제 목록 조회에 실패했습니다');
  }

  if (!assignments || assignments.length === 0) {
    return success({ assignments: [], total: 0 });
  }

  // 3. Get submission counts for each assignment
  const assignmentIds = assignments.map((a) => a.id);
  const { data: submissions } = await client
    .from('submissions')
    .select('assignment_id')
    .in('assignment_id', assignmentIds);

  const submissionCountMap = new Map<string, number>();
  submissions?.forEach((s) => {
    submissionCountMap.set(s.assignment_id, (submissionCountMap.get(s.assignment_id) || 0) + 1);
  });

  // 4. Get total enrolled students count
  const { count: totalStudents } = await client
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  // 5. Transform data
  const assignmentList = assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    dueDate: assignment.due_date,
    weight: assignment.weight,
    status: assignment.status as 'draft' | 'published' | 'closed',
    submissionCount: submissionCountMap.get(assignment.id) || 0,
    totalStudents: totalStudents || 0,
    createdAt: assignment.created_at,
  }));

  return success({
    assignments: assignmentList,
    total: assignmentList.length,
  });
}

/**
 * Create Assignment (Instructor)
 */
export async function createAssignment(
  client: SupabaseClient,
  instructorId: string,
  courseId: string,
  request: CreateAssignmentRequest,
): Promise<Result<CreateAssignmentResponse, string>> {
  // 1. Check course ownership
  const { data: course, error: courseError } = await client
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    return failure(assignmentErrorCodes.courseNotFound, '코스를 찾을 수 없습니다');
  }

  if (course.instructor_id !== instructorId) {
    return failure(assignmentErrorCodes.unauthorized, '권한이 없습니다');
  }

  // 2. Validate due date
  const dueDate = new Date(request.dueDate);
  if (dueDate < new Date()) {
    return failure(
      assignmentErrorCodes.invalidInput,
      '마감일은 현재 시간 이후여야 합니다',
    );
  }

  // 3. Insert assignment
  const { data: assignment, error: insertError } = await client
    .from('assignments')
    .insert({
      course_id: courseId,
      title: request.title,
      description: request.description,
      due_date: request.dueDate,
      weight: request.weight,
      allow_late: request.allowLate,
      allow_resubmission: request.allowResubmission,
      status: 'draft',
    })
    .select('id, title, status')
    .single();

  if (insertError || !assignment) {
    return failure(assignmentErrorCodes.databaseError, '과제 생성에 실패했습니다');
  }

  return success({
    id: assignment.id,
    title: assignment.title,
    status: assignment.status as 'draft' | 'published' | 'closed',
  });
}

/**
 * Update Assignment (Instructor)
 */
export async function updateAssignment(
  client: SupabaseClient,
  instructorId: string,
  assignmentId: string,
  request: UpdateAssignmentRequest,
): Promise<Result<void, string>> {
  // 1. Check ownership
  const { data: assignment, error: assignmentError } = await client
    .from('assignments')
    .select('id, course_id, courses!inner(instructor_id)')
    .eq('id', assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return failure(assignmentErrorCodes.assignmentNotFound, '과제를 찾을 수 없습니다');
  }

  const instructorIdFromCourse = (assignment.courses as any).instructor_id;
  if (instructorIdFromCourse !== instructorId) {
    return failure(assignmentErrorCodes.unauthorized, '권한이 없습니다');
  }

  // 2. Build update object
  const updateData: Record<string, any> = {};
  if (request.title !== undefined) updateData.title = request.title;
  if (request.description !== undefined) updateData.description = request.description;
  if (request.dueDate !== undefined) {
    const dueDate = new Date(request.dueDate);
    if (dueDate < new Date()) {
      return failure(
        assignmentErrorCodes.invalidInput,
        '마감일은 현재 시간 이후여야 합니다',
      );
    }
    updateData.due_date = request.dueDate;
  }
  if (request.weight !== undefined) updateData.weight = request.weight;
  if (request.allowLate !== undefined) updateData.allow_late = request.allowLate;
  if (request.allowResubmission !== undefined)
    updateData.allow_resubmission = request.allowResubmission;
  updateData.updated_at = new Date().toISOString();

  // 3. Update assignment
  const { error: updateError } = await client
    .from('assignments')
    .update(updateData)
    .eq('id', assignmentId);

  if (updateError) {
    return failure(assignmentErrorCodes.databaseError, '과제 수정에 실패했습니다');
  }

  return success(undefined);
}

/**
 * Update Assignment Status (Instructor)
 */
export async function updateAssignmentStatus(
  client: SupabaseClient,
  instructorId: string,
  assignmentId: string,
  request: UpdateAssignmentStatusRequest,
): Promise<Result<void, string>> {
  // 1. Check ownership
  const { data: assignment, error: assignmentError } = await client
    .from('assignments')
    .select('id, status, course_id, courses!inner(instructor_id)')
    .eq('id', assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return failure(assignmentErrorCodes.assignmentNotFound, '과제를 찾을 수 없습니다');
  }

  const instructorIdFromCourse = (assignment.courses as any).instructor_id;
  if (instructorIdFromCourse !== instructorId) {
    return failure(assignmentErrorCodes.unauthorized, '권한이 없습니다');
  }

  // 2. Validate status transition
  if (assignment.status === 'closed' && request.status === 'published') {
    return failure(
      assignmentErrorCodes.invalidInput,
      '마감된 과제는 다시 공개할 수 없습니다',
    );
  }

  // 3. Update status
  const { error: updateError } = await client
    .from('assignments')
    .update({
      status: request.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assignmentId);

  if (updateError) {
    return failure(assignmentErrorCodes.databaseError, '상태 변경에 실패했습니다');
  }

  return success(undefined);
}

/**
 * Get Assignment Submissions (Instructor)
 */
export async function getAssignmentSubmissions(
  client: SupabaseClient,
  instructorId: string,
  assignmentId: string,
  query: SubmissionFilterQuery,
): Promise<Result<SubmissionListResponse, string>> {
  // 1. Check ownership
  const { data: assignment, error: assignmentError } = await client
    .from('assignments')
    .select('id, course_id, courses!inner(instructor_id)')
    .eq('id', assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return failure(assignmentErrorCodes.assignmentNotFound, '과제를 찾을 수 없습니다');
  }

  const instructorIdFromCourse = (assignment.courses as any).instructor_id;
  if (instructorIdFromCourse !== instructorId) {
    return failure(assignmentErrorCodes.unauthorized, '권한이 없습니다');
  }

  // 2. Build query with filter
  let submissionsQuery = client
    .from('submissions')
    .select('id, assignment_id, learner_id, status, is_late, submitted_at, score')
    .eq('assignment_id', assignmentId);

  // Apply filter
  if (query.filter === 'pending') {
    submissionsQuery = submissionsQuery.eq('status', 'submitted');
  } else if (query.filter === 'late') {
    submissionsQuery = submissionsQuery.eq('is_late', true);
  } else if (query.filter === 'resubmission') {
    submissionsQuery = submissionsQuery.eq('status', 'resubmission_required');
  }

  const { data: submissions, error: submissionsError } = await submissionsQuery.order(
    'submitted_at',
    { ascending: false },
  );

  if (submissionsError) {
    return failure(submissionErrorCodes.databaseError, '제출물 조회에 실패했습니다');
  }

  // 3. Get learner names
  const learnerIds = [...new Set(submissions?.map((s) => s.learner_id) || [])];
  const { data: profiles } = await client
    .from('profiles')
    .select('id, name')
    .in('id', learnerIds);

  const profileMap = new Map<string, string>();
  profiles?.forEach((p: any) => {
    profileMap.set(p.id, p.name);
  });

  // 4. Transform data
  const submissionList = submissions?.map((s: any) => ({
    id: s.id,
    assignmentId: s.assignment_id,
    learnerId: s.learner_id,
    learnerName: profileMap.get(s.learner_id) ?? '알 수 없음',
    status: s.status,
    isLate: s.is_late,
    submittedAt: s.submitted_at,
    score: s.score,
  })) || [];

  return success({
    submissions: submissionList,
    total: submissions.length,
  });
}

import type { SubmissionDetail, GradeSubmissionRequest } from './schema';

/**
 * Get Submission Detail (Instructor)
 *
 * @param client - Supabase client
 * @param instructorId - Instructor ID
 * @param submissionId - Submission ID
 * @returns Submission detail or error
 */
export async function getSubmissionDetail(
  client: SupabaseClient,
  instructorId: string,
  submissionId: string,
): Promise<Result<SubmissionDetail, string>> {
  // 1. Get submission with assignment and course info
  const { data: submission, error: submissionError } = await client
    .from('submissions')
    .select(
      `
      id,
      assignment_id,
      learner_id,
      text_content,
      link,
      status,
      score,
      feedback,
      is_late,
      submitted_at,
      graded_at,
      assignments!inner(
        title,
        allow_resubmission,
        courses!inner(instructor_id)
      ),
      profiles!inner(name)
    `,
    )
    .eq('id', submissionId)
    .single();

  if (submissionError || !submission) {
    return failure(submissionErrorCodes.submissionNotFound, '제출물을 찾을 수 없습니다');
  }

  // 2. Check ownership
  const instructorIdFromCourse = (submission.assignments as any).courses.instructor_id;
  if (instructorIdFromCourse !== instructorId) {
    return failure(submissionErrorCodes.unauthorized, '권한이 없습니다');
  }

  // 3. Build response
  const detail: SubmissionDetail = {
    id: submission.id,
    assignmentId: submission.assignment_id,
    assignmentTitle: (submission.assignments as any).title,
    learnerId: submission.learner_id,
    learnerName: (submission.profiles as any).name,
    textContent: submission.text_content,
    link: submission.link,
    status: submission.status as 'submitted' | 'graded' | 'resubmission_required',
    score: submission.score,
    feedback: submission.feedback,
    isLate: submission.is_late,
    submittedAt: submission.submitted_at,
    gradedAt: submission.graded_at,
    allowResubmission: (submission.assignments as any).allow_resubmission,
  };

  return success(detail);
}

/**
 * Grade Submission (Instructor)
 *
 * @param client - Supabase client
 * @param instructorId - Instructor ID
 * @param submissionId - Submission ID
 * @param request - Grade submission request
 * @returns Success or error
 */
export async function gradeSubmission(
  client: SupabaseClient,
  instructorId: string,
  submissionId: string,
  request: GradeSubmissionRequest,
): Promise<Result<void, string>> {
  // 1. Get submission with assignment info
  const { data: submission, error: submissionError } = await client
    .from('submissions')
    .select(
      `
      id,
      assignment_id,
      status,
      assignments!inner(
        allow_resubmission,
        courses!inner(instructor_id)
      )
    `,
    )
    .eq('id', submissionId)
    .single();

  if (submissionError || !submission) {
    return failure(submissionErrorCodes.submissionNotFound, '제출물을 찾을 수 없습니다');
  }

  // 2. Check ownership
  const instructorIdFromCourse = (submission.assignments as any).courses.instructor_id;
  if (instructorIdFromCourse !== instructorId) {
    return failure(submissionErrorCodes.unauthorized, '권한이 없습니다');
  }

  // 3. Check if resubmission is allowed (if requested)
  if (
    request.requestResubmission &&
    !(submission.assignments as any).allow_resubmission
  ) {
    return failure(
      submissionErrorCodes.resubmissionNotAllowed,
      '이 과제는 재제출을 허용하지 않습니다',
    );
  }

  // 4. Update submission
  const updateData: Record<string, any> = {
    score: request.score,
    feedback: request.feedback,
    graded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (request.requestResubmission) {
    updateData.status = 'resubmission_required';
  } else {
    updateData.status = 'graded';
  }

  const { error: updateError } = await client
    .from('submissions')
    .update(updateData)
    .eq('id', submissionId);

  if (updateError) {
    return failure(submissionErrorCodes.databaseError, '채점 저장에 실패했습니다');
  }

  return success(undefined);
}
