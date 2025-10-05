import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { EnrollRequestSchema, UnenrollRequestSchema } from './schema';
import { enrollCourse, unenrollCourse } from './service';
import { enrollmentErrorCodes } from './error';
import { isFailure } from '@/backend/http/result';

export function registerEnrollmentRoutes(app: Hono<AppEnv>) {
  // POST /enrollments - 수강신청
  app.post('/enrollments', async (c) => {
    const supabase = c.get('supabase');

    // Get current user from Authorization header
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: enrollmentErrorCodes.unauthorized,
            message: '인증이 필요합니다',
          },
        },
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return c.json(
        {
          error: {
            code: enrollmentErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401
      );
    }

    const user = userData.user;

    // Parse body
    const body = await c.req.json();
    const parseResult = EnrollRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: enrollmentErrorCodes.invalidRequest,
            message: parseResult.error.message,
          },
        },
        400
      );
    }

    const { courseId } = parseResult.data;
    const result = await enrollCourse(supabase, user.id, courseId);

    if (!isFailure(result)) {
      return c.json(result.data, 201);
    }

    return c.json(
      {
        error: {
          code: result.error,
          message: result.message,
        },
      },
      result.error === enrollmentErrorCodes.alreadyEnrolled ? 409 : 400
    );
  });

  // DELETE /enrollments - 수강취소
  app.delete('/enrollments', async (c) => {
    const supabase = c.get('supabase');

    // Get current user from Authorization header
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: enrollmentErrorCodes.unauthorized,
            message: '인증이 필요합니다',
          },
        },
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return c.json(
        {
          error: {
            code: enrollmentErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401
      );
    }

    const user = userData.user;

    // Parse body
    const body = await c.req.json();
    const parseResult = UnenrollRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: enrollmentErrorCodes.invalidRequest,
            message: parseResult.error.message,
          },
        },
        400
      );
    }

    const { courseId } = parseResult.data;
    const result = await unenrollCourse(supabase, user.id, courseId);

    if (!isFailure(result)) {
      return c.json(result.data);
    }

    return c.json(
      {
        error: {
          code: result.error,
          message: result.message,
        },
      },
      result.error === enrollmentErrorCodes.notEnrolled ? 404 : 400
    );
  });
}
