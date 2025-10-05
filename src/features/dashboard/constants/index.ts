export const DASHBOARD_CONSTANTS = {
  // 마감 임박 기준일 (7일)
  UPCOMING_DEADLINE_DAYS: 7,
  // 최근 피드백 최대 개수
  MAX_RECENT_FEEDBACK: 5,
  // 진행률 소수점 자리수
  PROGRESS_DECIMAL_PLACES: 2,
} as const;

export const CACHE_KEYS = {
  DASHBOARD: 'dashboard',
} as const;

export const CACHE_TIME = {
  // 5분 캐싱
  STALE_TIME: 5 * 60 * 1000,
  CACHE_TIME: 10 * 60 * 1000,
} as const;
