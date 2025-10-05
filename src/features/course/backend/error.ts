export const courseErrorCodes = {
  invalidRequest: 'COURSE_INVALID_REQUEST',
  courseNotFound: 'COURSE_NOT_FOUND',
  courseNotPublished: 'COURSE_NOT_PUBLISHED',
  fetchFailed: 'COURSE_FETCH_FAILED',
  unauthorized: 'COURSE_UNAUTHORIZED',
} as const;

export type CourseServiceError =
  (typeof courseErrorCodes)[keyof typeof courseErrorCodes];
