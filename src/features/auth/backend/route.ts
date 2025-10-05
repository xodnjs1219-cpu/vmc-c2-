import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { SignupRequestSchema } from './schema';
import { signup } from './service';
import { getRequiredTerms } from './terms-service';
import { signupErrorCodes, type SignupServiceError } from './error';

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
  // Get user profile
  app.get('/auth/profile', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get current user from JWT
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', '인증이 필요합니다'),
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', '유효하지 않은 토큰입니다'),
      );
    }

    const userId = userData.user.id;

    // Get profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      logger.error('Profile fetch failed', profileError);
      return respond(
        c,
        failure(500, 'PROFILE_FETCH_FAILED', '프로필 조회에 실패했습니다'),
      );
    }

    return c.json({
      ok: true,
      data: profile,
    });
  });

  // Get required terms
  app.get('/auth/terms', async (c) => {
    const supabase = getSupabase(c);
    const result = await getRequiredTerms(supabase);

    return respond(c, result);
  });

  // Signup
  app.post('/auth/signup', async (c) => {
    const body = await c.req.json();
    const parsedBody = SignupRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          signupErrorCodes.invalidRequest,
          '입력값이 유효하지 않습니다',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await signup(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SignupServiceError, unknown>;

      // Error logging
      if (errorResult.error.code === signupErrorCodes.authCreationFailed) {
        logger.error('Auth account creation failed', errorResult.error.message);
      } else if (
        errorResult.error.code === signupErrorCodes.profileCreationFailed
      ) {
        logger.error('Profile creation failed', errorResult.error.message);
      } else if (
        errorResult.error.code === signupErrorCodes.termsAgreementFailed
      ) {
        logger.error('Terms agreement failed', errorResult.error.message);
      } else if (errorResult.error.code === signupErrorCodes.transactionFailed) {
        logger.error('Transaction failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
