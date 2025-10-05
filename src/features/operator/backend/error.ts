export const operatorErrorCodes = {
  unauthorized: 'OPERATOR_UNAUTHORIZED',
  invalidRequest: 'OPERATOR_INVALID_REQUEST',
  reportNotFound: 'OPERATOR_REPORT_NOT_FOUND',
  categoryNotFound: 'OPERATOR_CATEGORY_NOT_FOUND',
  difficultyNotFound: 'OPERATOR_DIFFICULTY_NOT_FOUND',
  categoryInUse: 'OPERATOR_CATEGORY_IN_USE',
  difficultyInUse: 'OPERATOR_DIFFICULTY_IN_USE',
  databaseError: 'OPERATOR_DATABASE_ERROR',
} as const;

export type OperatorErrorCode =
  (typeof operatorErrorCodes)[keyof typeof operatorErrorCodes];
