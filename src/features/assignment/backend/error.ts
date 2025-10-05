/**
 * Assignment Domain Error Codes
 */
export const assignmentErrorCodes = {
  invalidRequest: 'ASSIGNMENT_INVALID_REQUEST',
  unauthorized: 'ASSIGNMENT_UNAUTHORIZED',
  notEnrolled: 'ASSIGNMENT_NOT_ENROLLED',
  notFound: 'ASSIGNMENT_NOT_FOUND',
  notPublished: 'ASSIGNMENT_NOT_PUBLISHED',
  fetchFailed: 'ASSIGNMENT_FETCH_FAILED',
} as const;

export type AssignmentErrorCode =
  (typeof assignmentErrorCodes)[keyof typeof assignmentErrorCodes];
