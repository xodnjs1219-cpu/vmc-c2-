import type { Hono } from 'hono';
import { failure, respond } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { getDashboardData } from './service';
import { dashboardErrorCodes } from './error';

export const registerDashboardRoutes = (app: Hono<AppEnv>) => {
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

    // Check if user is learner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'learner') {
      return respond(
        c,
        failure(
          403,
          dashboardErrorCodes.forbidden,
          '학습자 전용 페이지입니다',
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
};
