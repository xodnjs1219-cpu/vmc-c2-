/**
 * Assignment Domain Error Codes
 */
export const assignmentErrorCodes = {
  invalidRequest: 'ASSIGNMENT_INVALID_REQUEST',
  invalidInput: 'ASSIGNMENT_INVALID_INPUT',
  unauthorized: 'ASSIGNMENT_UNAUTHORIZED',
  notEnrolled: 'ASSIGNMENT_NOT_ENROLLED',
  notFound: 'ASSIGNMENT_NOT_FOUND',
  assignmentNotFound: 'ASSIGNMENT_NOT_FOUND',
  courseNotFound: 'ASSIGNMENT_COURSE_NOT_FOUND',
  notPublished: 'ASSIGNMENT_NOT_PUBLISHED',
  fetchFailed: 'ASSIGNMENT_FETCH_FAILED',
  databaseError: 'ASSIGNMENT_DATABASE_ERROR',
} as const;

export type AssignmentErrorCode =
  (typeof assignmentErrorCodes)[keyof typeof assignmentErrorCodes];

/**
 * Submission Domain Error Codes
 */
export const submissionErrorCodes = {
  // 인증/권한 관련
  unauthorized: 'SUBMISSION_UNAUTHORIZED',
  notEnrolled: 'SUBMISSION_NOT_ENROLLED',

  // 요청 관련
  invalidRequest: 'SUBMISSION_INVALID_REQUEST',

  // 과제 상태 관련
  assignmentNotFound: 'SUBMISSION_ASSIGNMENT_NOT_FOUND',
  assignmentNotPublished: 'SUBMISSION_ASSIGNMENT_NOT_PUBLISHED',
  assignmentClosed: 'SUBMISSION_ASSIGNMENT_CLOSED',

  // 제출 정책 관련
  deadlinePassed: 'SUBMISSION_DEADLINE_PASSED',
  alreadySubmitted: 'SUBMISSION_ALREADY_SUBMITTED',

  // 재제출 관련
  resubmissionNotAllowed: 'SUBMISSION_RESUBMISSION_NOT_ALLOWED',
  resubmissionNotRequired: 'SUBMISSION_RESUBMISSION_NOT_REQUIRED',
  submissionNotFound: 'SUBMISSION_NOT_FOUND',

  // 서버 에러
  databaseError: 'SUBMISSION_DATABASE_ERROR',
} as const;

export type SubmissionErrorCode = typeof submissionErrorCodes[keyof typeof submissionErrorCodes];
