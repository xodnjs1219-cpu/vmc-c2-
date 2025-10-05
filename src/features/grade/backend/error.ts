export const gradeErrorCodes = {
  unauthorized: 'GRADE_UNAUTHORIZED',
  databaseError: 'GRADE_DATABASE_ERROR',
} as const;

type GradeErrorValue = (typeof gradeErrorCodes)[keyof typeof gradeErrorCodes];

export type GradeServiceError = GradeErrorValue;
