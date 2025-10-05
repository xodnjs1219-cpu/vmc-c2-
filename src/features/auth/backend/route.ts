import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { SignupRequestSchema } from './schema';
import { signup } from './service';
import { getRequiredTerms } from './terms-service';
import { signupErrorCodes, type SignupServiceError } from './error';

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
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
