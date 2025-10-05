export const enrollmentErrorCodes = {
  invalidRequest: 'ENROLLMENT_INVALID_REQUEST',
  courseNotFound: 'ENROLLMENT_COURSE_NOT_FOUND',
  courseNotPublished: 'ENROLLMENT_COURSE_NOT_PUBLISHED',
  alreadyEnrolled: 'ENROLLMENT_ALREADY_ENROLLED',
  notEnrolled: 'ENROLLMENT_NOT_ENROLLED',
  enrollmentFailed: 'ENROLLMENT_FAILED',
  unenrollmentFailed: 'UNENROLLMENT_FAILED',
  unauthorized: 'ENROLLMENT_UNAUTHORIZED',
} as const;

export type EnrollmentServiceError =
  (typeof enrollmentErrorCodes)[keyof typeof enrollmentErrorCodes];
