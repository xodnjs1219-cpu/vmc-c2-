import { match } from "ts-pattern";

const PUBLIC_PATHS = ["/", "/login", "/signup"] as const;
const PUBLIC_PREFIXES = ["/_next", "/api", "/favicon", "/static", "/docs", "/images"] as const;

export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const AUTH_ENTRY_PATHS = [LOGIN_PATH, SIGNUP_PATH] as const;
export const isAuthEntryPath = (
  pathname: string
): pathname is (typeof AUTH_ENTRY_PATHS)[number] =>
  AUTH_ENTRY_PATHS.includes(pathname as (typeof AUTH_ENTRY_PATHS)[number]);

export const isAuthPublicPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();

  return match(normalized)
    .when(
      (path) => PUBLIC_PATHS.some((publicPath) => publicPath === path),
      () => true
    )
    .when(
      (path) => PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix)),
      () => true
    )
    .otherwise(() => false);
};

export const shouldProtectPath = (pathname: string) => !isAuthPublicPath(pathname);

// User roles
export const USER_ROLES = {
  LEARNER: 'learner',
  INSTRUCTOR: 'instructor',
  OPERATOR: 'operator',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.LEARNER]: '학습자',
  [USER_ROLES.INSTRUCTOR]: '강사',
  [USER_ROLES.OPERATOR]: '운영자',
};

export const ROLE_REDIRECT_PATHS: Record<UserRole, string> = {
  [USER_ROLES.LEARNER]: '/courses',
  [USER_ROLES.INSTRUCTOR]: '/instructor/dashboard',
  [USER_ROLES.OPERATOR]: '/operator/dashboard',
};
