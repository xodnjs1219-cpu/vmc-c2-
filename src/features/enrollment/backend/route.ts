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

    // Get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return c.json(
        {
          error: {
            code: enrollmentErrorCodes.unauthorized,
            message: 'Authentication required',
          },
        },
        401
      );
    }

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

    // Get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return c.json(
        {
          error: {
            code: enrollmentErrorCodes.unauthorized,
            message: 'Authentication required',
          },
        },
        401
      );
    }

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
