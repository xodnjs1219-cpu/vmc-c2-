import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { isFailure } from '@/backend/http/result';
import { operatorErrorCodes } from './error';
import {
  createReport,
  getReports,
  updateReport,
  getCategories,
  createCategory,
  updateCategory,
  getDifficulties,
  createDifficulty,
  updateDifficulty,
} from './service';
import {
  CreateReportRequestSchema,
  UpdateReportRequestSchema,
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
  CreateDifficultyRequestSchema,
  UpdateDifficultyRequestSchema,
  ReportStatusSchema,
} from './schema';

const checkOperatorRole = async (
  supabase: any,
  userId: string,
): Promise<boolean> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role === 'operator';
};

export function registerOperatorRoutes(app: Hono<AppEnv>) {
  // ========================================
  // Report Routes
  // ========================================

  /**
   * POST /reports
   * Create report (Any authenticated user)
   */
  app.post('/reports', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: operatorErrorCodes.unauthorized,
            message: '인증이 필요합니다',
          },
        },
        401,
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return c.json(
        {
          error: {
            code: operatorErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401,
      );
    }

    const userId = userData.user.id;

    // Parse request body
    const body = await c.req.json();
    const parseResult = CreateReportRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: operatorErrorCodes.invalidRequest,
            message: parseResult.error.errors[0].message,
          },
        },
        400,
      );
    }

    const result = await createReport(supabase, userId, parseResult.data);

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
      400,
    );
  });

  /**
   * GET /operator/reports
   * Get all reports (Operator only)
   */
  app.get('/operator/reports', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: operatorErrorCodes.unauthorized,
            message: '인증이 필요합니다',
          },
        },
        401,
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return c.json(
        {
          error: {
            code: operatorErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401,
      );
    }

    const userId = userData.user.id;

    // Check operator role
    const isOperator = await checkOperatorRole(supabase, userId);
    if (!isOperator) {
      return c.json(
        {
          error: {
            code: operatorErrorCodes.unauthorized,
            message: '운영자만 접근할 수 있습니다',
          },
        },
        403,
      );
    }

    // Parse query params
    const statusParam = c.req.query('status');
    const statusParseResult = statusParam
      ? ReportStatusSchema.safeParse(statusParam)
      : { success: true, data: undefined };

    if (!statusParseResult.success) {
      return c.json(
        {
          error: {
            code: operatorErrorCodes.invalidRequest,
            message: '유효하지 않은 상태 값입니다',
          },
        },
        400,
      );
    }

    const result = await getReports(supabase, statusParseResult.data);

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
      400,
    );
  });

  /**
   * PATCH /operator/reports/:reportId
   * Update report (Operator only)
   */
  app.patch('/operator/reports/:reportId', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: operatorErrorCodes.unauthorized,
            message: '인증이 필요합니다',
          },
        },
        401,
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return c.json(
        {
          error: {
            code: operatorErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401,
      );
    }

    const userId = userData.user.id;

    // Check operator role
    const isOperator = await checkOperatorRole(supabase, userId);
    if (!isOperator) {
      return c.json(
        {
          error: {
            code: operatorErrorCodes.unauthorized,
            message: '운영자만 접근할 수 있습니다',
          },
        },
        403,
      );
    }

    const reportId = c.req.param('reportId');

    // Parse request body
    const body = await c.req.json();
    const parseResult = UpdateReportRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: operatorErrorCodes.invalidRequest,
            message: parseResult.error.errors[0].message,
          },
        },
        400,
      );
    }

    const result = await updateReport(supabase, reportId, parseResult.data);

    if (!isFailure(result)) {
      return c.json({ success: true });
    }

    return c.json(
      {
        error: {
          code: result.error,
          message: result.message,
        },
      },
      result.error === operatorErrorCodes.reportNotFound ? 404 : 400,
    );
  });

  // ========================================
  // Category Routes
  // ========================================

  /**
   * GET /operator/categories
   * Get all categories (Operator only)
   */
  app.get('/operator/categories', async (c) => {
    const supabase = c.get('supabase');

    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '인증이 필요합니다' } }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '유효하지 않은 토큰입니다' } }, 401);
    }

    const isOperator = await checkOperatorRole(supabase, userData.user.id);
    if (!isOperator) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '운영자만 접근할 수 있습니다' } }, 403);
    }

    const result = await getCategories(supabase);

    if (!isFailure(result)) {
      return c.json(result.data);
    }

    return c.json({ error: { code: result.error, message: result.message } }, 400);
  });

  /**
   * POST /operator/categories
   * Create category (Operator only)
   */
  app.post('/operator/categories', async (c) => {
    const supabase = c.get('supabase');

    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '인증이 필요합니다' } }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '유효하지 않은 토큰입니다' } }, 401);
    }

    const isOperator = await checkOperatorRole(supabase, userData.user.id);
    if (!isOperator) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '운영자만 접근할 수 있습니다' } }, 403);
    }

    const body = await c.req.json();
    const parseResult = CreateCategoryRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json({ error: { code: operatorErrorCodes.invalidRequest, message: parseResult.error.errors[0].message } }, 400);
    }

    const result = await createCategory(supabase, parseResult.data);

    if (!isFailure(result)) {
      return c.json(result.data, 201);
    }

    return c.json({ error: { code: result.error, message: result.message } }, 400);
  });

  /**
   * PATCH /operator/categories/:categoryId
   * Update category (Operator only)
   */
  app.patch('/operator/categories/:categoryId', async (c) => {
    const supabase = c.get('supabase');

    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '인증이 필요합니다' } }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '유효하지 않은 토큰입니다' } }, 401);
    }

    const isOperator = await checkOperatorRole(supabase, userData.user.id);
    if (!isOperator) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '운영자만 접근할 수 있습니다' } }, 403);
    }

    const categoryId = c.req.param('categoryId');

    const body = await c.req.json();
    const parseResult = UpdateCategoryRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json({ error: { code: operatorErrorCodes.invalidRequest, message: parseResult.error.errors[0].message } }, 400);
    }

    const result = await updateCategory(supabase, categoryId, parseResult.data);

    if (!isFailure(result)) {
      return c.json({ success: true });
    }

    return c.json({ error: { code: result.error, message: result.message } }, result.error === operatorErrorCodes.categoryNotFound ? 404 : 400);
  });

  // ========================================
  // Difficulty Routes
  // ========================================

  /**
   * GET /operator/difficulties
   * Get all difficulties (Operator only)
   */
  app.get('/operator/difficulties', async (c) => {
    const supabase = c.get('supabase');

    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '인증이 필요합니다' } }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '유효하지 않은 토큰입니다' } }, 401);
    }

    const isOperator = await checkOperatorRole(supabase, userData.user.id);
    if (!isOperator) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '운영자만 접근할 수 있습니다' } }, 403);
    }

    const result = await getDifficulties(supabase);

    if (!isFailure(result)) {
      return c.json(result.data);
    }

    return c.json({ error: { code: result.error, message: result.message } }, 400);
  });

  /**
   * POST /operator/difficulties
   * Create difficulty (Operator only)
   */
  app.post('/operator/difficulties', async (c) => {
    const supabase = c.get('supabase');

    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '인증이 필요합니다' } }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '유효하지 않은 토큰입니다' } }, 401);
    }

    const isOperator = await checkOperatorRole(supabase, userData.user.id);
    if (!isOperator) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '운영자만 접근할 수 있습니다' } }, 403);
    }

    const body = await c.req.json();
    const parseResult = CreateDifficultyRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json({ error: { code: operatorErrorCodes.invalidRequest, message: parseResult.error.errors[0].message } }, 400);
    }

    const result = await createDifficulty(supabase, parseResult.data);

    if (!isFailure(result)) {
      return c.json(result.data, 201);
    }

    return c.json({ error: { code: result.error, message: result.message } }, 400);
  });

  /**
   * PATCH /operator/difficulties/:difficultyId
   * Update difficulty (Operator only)
   */
  app.patch('/operator/difficulties/:difficultyId', async (c) => {
    const supabase = c.get('supabase');

    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '인증이 필요합니다' } }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '유효하지 않은 토큰입니다' } }, 401);
    }

    const isOperator = await checkOperatorRole(supabase, userData.user.id);
    if (!isOperator) {
      return c.json({ error: { code: operatorErrorCodes.unauthorized, message: '운영자만 접근할 수 있습니다' } }, 403);
    }

    const difficultyId = c.req.param('difficultyId');

    const body = await c.req.json();
    const parseResult = UpdateDifficultyRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json({ error: { code: operatorErrorCodes.invalidRequest, message: parseResult.error.errors[0].message } }, 400);
    }

    const result = await updateDifficulty(supabase, difficultyId, parseResult.data);

    if (!isFailure(result)) {
      return c.json({ success: true });
    }

    return c.json({ error: { code: result.error, message: result.message } }, result.error === operatorErrorCodes.difficultyNotFound ? 404 : 400);
  });
}
