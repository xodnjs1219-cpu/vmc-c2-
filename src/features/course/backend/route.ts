import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import {
  CourseListQuerySchema,
  CourseDetailParamsSchema,
  CreateCourseRequestSchema,
  UpdateCourseRequestSchema,
  UpdateCourseStatusRequestSchema,
} from './schema';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateCourseStatus,
} from './service';
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

  // POST /instructor/courses - 코스 생성 (Instructor only)
  app.post('/instructor/courses', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: courseErrorCodes.unauthorized,
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
            code: courseErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401
      );
    }

    const userId = userData.user.id;

    // Check instructor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'instructor') {
      return c.json(
        {
          error: {
            code: courseErrorCodes.forbidden,
            message: '강사만 코스를 생성할 수 있습니다',
          },
        },
        403
      );
    }

    // Parse request body
    const body = await c.req.json();
    const parseResult = CreateCourseRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: courseErrorCodes.invalidRequest,
            message: parseResult.error.errors[0].message,
          },
        },
        400
      );
    }

    const result = await createCourse(supabase, userId, parseResult.data);

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
      400
    );
  });

  // PATCH /instructor/courses/:id - 코스 수정 (Instructor only)
  app.patch('/instructor/courses/:id', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: courseErrorCodes.unauthorized,
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
            code: courseErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401
      );
    }

    const userId = userData.user.id;

    // Check instructor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'instructor') {
      return c.json(
        {
          error: {
            code: courseErrorCodes.forbidden,
            message: '강사만 코스를 수정할 수 있습니다',
          },
        },
        403
      );
    }

    // Parse params
    const parseParamsResult = CourseDetailParamsSchema.safeParse({ id: c.req.param('id') });
    if (!parseParamsResult.success) {
      return c.json(
        {
          error: {
            code: courseErrorCodes.invalidRequest,
            message: parseParamsResult.error.message,
          },
        },
        400
      );
    }

    // Parse request body
    const body = await c.req.json();
    const parseResult = UpdateCourseRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: courseErrorCodes.invalidRequest,
            message: parseResult.error.errors[0].message,
          },
        },
        400
      );
    }

    const result = await updateCourse(supabase, userId, parseParamsResult.data.id, parseResult.data);

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
      result.error === courseErrorCodes.courseNotFound ? 404 : result.error === courseErrorCodes.forbidden ? 403 : 400
    );
  });

  // PATCH /instructor/courses/:id/status - 코스 상태 변경 (Instructor only)
  app.patch('/instructor/courses/:id/status', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: courseErrorCodes.unauthorized,
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
            code: courseErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401
      );
    }

    const userId = userData.user.id;

    // Check instructor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'instructor') {
      return c.json(
        {
          error: {
            code: courseErrorCodes.forbidden,
            message: '강사만 코스 상태를 변경할 수 있습니다',
          },
        },
        403
      );
    }

    // Parse params
    const parseParamsResult = CourseDetailParamsSchema.safeParse({ id: c.req.param('id') });
    if (!parseParamsResult.success) {
      return c.json(
        {
          error: {
            code: courseErrorCodes.invalidRequest,
            message: parseParamsResult.error.message,
          },
        },
        400
      );
    }

    // Parse request body
    const body = await c.req.json();
    const parseResult = UpdateCourseStatusRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: courseErrorCodes.invalidRequest,
            message: parseResult.error.errors[0].message,
          },
        },
        400
      );
    }

    const result = await updateCourseStatus(supabase, userId, parseParamsResult.data.id, parseResult.data);

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
      result.error === courseErrorCodes.courseNotFound ? 404 : result.error === courseErrorCodes.forbidden ? 403 : 400
    );
  });
}
