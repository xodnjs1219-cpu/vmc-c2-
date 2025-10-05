export const courseErrorCodes = {
  invalidRequest: 'COURSE_INVALID_REQUEST',
  courseNotFound: 'COURSE_NOT_FOUND',
  courseNotPublished: 'COURSE_NOT_PUBLISHED',
  fetchFailed: 'COURSE_FETCH_FAILED',
  unauthorized: 'COURSE_UNAUTHORIZED',
  forbidden: 'COURSE_FORBIDDEN',
  createFailed: 'COURSE_CREATE_FAILED',
  updateFailed: 'COURSE_UPDATE_FAILED',
  invalidStatus: 'COURSE_INVALID_STATUS',
  categoryNotFound: 'COURSE_CATEGORY_NOT_FOUND',
  difficultyNotFound: 'COURSE_DIFFICULTY_NOT_FOUND',
} as const;

export type CourseServiceError =
  (typeof courseErrorCodes)[keyof typeof courseErrorCodes];
