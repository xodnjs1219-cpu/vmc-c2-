import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { CourseListQuerySchema, CourseDetailParamsSchema } from './schema';
import { getCourses, getCourseById } from './service';
import { courseErrorCodes } from './error';
import { isFailure } from '@/backend/http/result';

export function registerCourseRoutes(app: Hono<AppEnv>) {
  // GET /courses - 코스 목록 조회
  app.get('/courses', async (c) => {
    const supabase = c.get('supabase');

    // Parse query params
    const parseResult = CourseListQuerySchema.safeParse(c.req.query());
    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: courseErrorCodes.invalidRequest,
            message: parseResult.error.message,
          },
        },
        400
      );
    }

    const query = parseResult.data;
    const result = await getCourses(supabase, query);

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
      400
    );
  });

  // GET /courses/:id - 코스 상세 조회
  app.get('/courses/:id', async (c) => {
    const supabase = c.get('supabase');

    // Parse params
    const parseResult = CourseDetailParamsSchema.safeParse({ id: c.req.param('id') });
    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: courseErrorCodes.invalidRequest,
            message: parseResult.error.message,
          },
        },
        400
      );
    }

    const { id } = parseResult.data;

    // Get user ID from session (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    const result = await getCourseById(supabase, id, userId);

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
      result.error === courseErrorCodes.courseNotFound ? 404 : 400
    );
  });
}
