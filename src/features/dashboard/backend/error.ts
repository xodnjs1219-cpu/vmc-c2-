export const dashboardErrorCodes = {
  unauthorized: 'DASHBOARD_UNAUTHORIZED',
  forbidden: 'DASHBOARD_FORBIDDEN',
  fetchFailed: 'DASHBOARD_FETCH_FAILED',
  invalidRole: 'DASHBOARD_INVALID_ROLE',
  validationError: 'DASHBOARD_VALIDATION_ERROR',
} as const;

export type DashboardServiceError =
  (typeof dashboardErrorCodes)[keyof typeof dashboardErrorCodes];
