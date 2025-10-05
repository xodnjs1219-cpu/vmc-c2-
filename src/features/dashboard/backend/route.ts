import type { Hono } from 'hono';
import { failure, respond } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { getDashboardData, getInstructorDashboard } from './service';
import { dashboardErrorCodes } from './error';

export const registerDashboardRoutes = (app: Hono<AppEnv>) => {
  // Learner Dashboard
  app.get('/dashboard', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get current user from JWT
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return respond(
        c,
        failure(401, dashboardErrorCodes.unauthorized, '인증이 필요합니다'),
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return respond(
        c,
        failure(
          401,
          dashboardErrorCodes.unauthorized,
          '유효하지 않은 토큰입니다',
        ),
      );
    }

    const userId = userData.user.id;

    // Check if user is not instructor (learner, operator can access)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) {
      logger.error(`Profile query error for user ${userId}:`, profileError);
      return respond(
        c,
        failure(
          500,
          dashboardErrorCodes.fetchFailed,
          '프로필 조회 중 오류가 발생했습니다',
        ),
      );
    }

    if (!profile) {
      logger.warn(`Profile not found for user: ${userId}`);
      return respond(
        c,
        failure(
          404,
          dashboardErrorCodes.forbidden,
          '프로필 정보를 찾을 수 없습니다',
        ),
      );
    }

    if (profile.role === 'instructor') {
      return respond(
        c,
        failure(
          403,
          dashboardErrorCodes.forbidden,
          '강사는 학습자 대시보드에 접근할 수 없습니다',
        ),
      );
    }

    if (profile.role !== 'learner' && profile.role !== 'operator') {
      return respond(
        c,
        failure(
          403,
          dashboardErrorCodes.forbidden,
          '학습자 또는 운영자만 접근할 수 있습니다',
        ),
      );
    }

    const result = await getDashboardData(supabase, userId);

    if (!result.ok) {
      logger.error(
        'Dashboard data fetch failed',
        (result as { error: { message: string } }).error.message,
      );
    }

    return respond(c, result);
  });

  // Instructor Dashboard
  app.get('/instructor/dashboard', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get current user from JWT
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return respond(
        c,
        failure(401, dashboardErrorCodes.unauthorized, '인증이 필요합니다'),
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return respond(
        c,
        failure(
          401,
          dashboardErrorCodes.unauthorized,
          '유효하지 않은 토큰입니다',
        ),
      );
    }

    const userId = userData.user.id;

    // Check if user is instructor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'instructor') {
      return respond(
        c,
        failure(
          403,
          dashboardErrorCodes.forbidden,
          '강사 전용 페이지입니다',
        ),
      );
    }

    const result = await getInstructorDashboard(supabase, userId);

    if (!result.ok) {
      logger.error(
        'Instructor dashboard fetch failed',
        (result as { error: { message: string } }).error.message,
      );
    }

    return respond(c, result);
  });
};
