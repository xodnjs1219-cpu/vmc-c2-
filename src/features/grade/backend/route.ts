import type { Hono } from 'hono';
import { respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { getGrades } from './service';
import { gradeErrorCodes, type GradeServiceError } from './error';

export const registerGradeRoutes = (app: Hono<AppEnv>) => {
  app.get('/grades', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // TODO: 인증 미들웨어에서 userId 추출
    // 임시로 하드코딩 (인증 구현 시 수정 필요)
    const userId = c.req.header('x-user-id') ?? '';

    if (!userId) {
      logger.error('User ID not found in request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await getGrades(supabase, userId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<GradeServiceError, unknown>;

      if (errorResult.error.code === gradeErrorCodes.databaseError) {
        logger.error('Database error while fetching grades', errorResult.error.message);
      }
    }

    return respond(c, result);
  });
};
