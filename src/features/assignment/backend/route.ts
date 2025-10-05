import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { isFailure } from '@/backend/http/result';
import { assignmentErrorCodes, submissionErrorCodes } from './error';
import { getAssignmentDetail, submitAssignment, resubmitAssignment } from './service';
import {
  AssignmentDetailParamsSchema,
  SubmitAssignmentRequestSchema,
  ResubmitAssignmentRequestSchema,
} from './schema';

/**
 * Register Assignment Routes
 *
 * @param app - Hono app instance
 */
export function registerAssignmentRoutes(app: Hono<AppEnv>) {
  /**
   * GET /courses/:courseId/assignments/:assignmentId
   * Get assignment detail for learner
   */
  app.get('/courses/:courseId/assignments/:assignmentId', async (c) => {
    const supabase = c.get('supabase');

    // 세션에서 userId 추출
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: assignmentErrorCodes.unauthorized,
            message: '인증이 필요합니다',
          },
        },
        401,
      );
    }

    // 파라미터 파싱 및 검증
    const paramsResult = AssignmentDetailParamsSchema.safeParse({
      courseId: c.req.param('courseId'),
      assignmentId: c.req.param('assignmentId'),
    });

    if (!paramsResult.success) {
      return c.json(
        {
          success: false,
          error: {
            code: assignmentErrorCodes.invalidRequest,
            message: '잘못된 요청입니다',
          },
        },
        400,
      );
    }

    const { courseId, assignmentId } = paramsResult.data;

    // 서비스 호출
    const result = await getAssignmentDetail(
      supabase,
      user.id,
      courseId,
      assignmentId,
    );

    // 성공 응답
    if (!isFailure(result)) {
      return c.json(result.data, 200);
    }

    // 에러 응답
    const errorCode = result.error;

    if (errorCode === assignmentErrorCodes.notEnrolled) {
      return c.json(
        {
          error: {
            code: errorCode,
            message: '수강 중인 코스의 과제만 열람할 수 있습니다',
          },
        },
        403,
      );
    }

    if (errorCode === assignmentErrorCodes.notFound) {
      return c.json(
        {
          error: {
            code: errorCode,
            message: '과제를 찾을 수 없습니다',
          },
        },
        404,
      );
    }

    if (errorCode === assignmentErrorCodes.notPublished) {
      return c.json(
        {
          error: {
            code: errorCode,
            message: '아직 공개되지 않은 과제입니다',
          },
        },
        404,
      );
    }

    // 기타 에러
    return c.json(
      {
        error: {
          code: errorCode,
          message: result.message,
        },
      },
      400,
    );
  });

  /**
   * POST /submissions
   * Submit assignment
   */
  app.post('/submissions', async (c) => {
    const supabase = c.get('supabase');

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: submissionErrorCodes.unauthorized,
            message: '인증이 필요합니다',
          },
        },
        401,
      );
    }

    // 요청 바디 파싱 및 검증
    const body = await c.req.json();
    const parseResult = SubmitAssignmentRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          error: {
            code: submissionErrorCodes.invalidRequest,
            message: '잘못된 요청입니다',
          },
        },
        400,
      );
    }

    // 서비스 호출
    const result = await submitAssignment(supabase, user.id, parseResult.data);

    // 성공 응답
    if (!isFailure(result)) {
      return c.json(result.data, 201);
    }

    // 에러 응답
    const errorCode = result.error;

    if (errorCode === submissionErrorCodes.notEnrolled) {
      return c.json(
        {
          error: {
            code: errorCode,
            message: result.message,
          },
        },
        403,
      );
    }

    if (errorCode === submissionErrorCodes.assignmentNotFound) {
      return c.json(
        {
          error: {
            code: errorCode,
            message: result.message,
          },
        },
        404,
      );
    }

    if (
      errorCode === submissionErrorCodes.deadlinePassed ||
      errorCode === submissionErrorCodes.alreadySubmitted ||
      errorCode === submissionErrorCodes.assignmentNotPublished ||
      errorCode === submissionErrorCodes.assignmentClosed
    ) {
      return c.json(
        {
          error: {
            code: errorCode,
            message: result.message,
          },
        },
        400,
      );
    }

    // 기타 에러
    return c.json(
      {
        error: {
          code: errorCode,
          message: result.message,
        },
      },
      500,
    );
  });

  /**
   * PUT /submissions/:id
   * Resubmit assignment
   */
  app.put('/submissions/:id', async (c) => {
    const supabase = c.get('supabase');

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: submissionErrorCodes.unauthorized,
            message: '인증이 필요합니다',
          },
        },
        401,
      );
    }

    // 파라미터 및 바디 파싱
    const submissionId = c.req.param('id');
    const body = await c.req.json();

    const parseResult = ResubmitAssignmentRequestSchema.safeParse({
      submissionId,
      textContent: body.textContent,
      link: body.link,
    });

    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          error: {
            code: submissionErrorCodes.invalidRequest,
            message: '잘못된 요청입니다',
          },
        },
        400,
      );
    }

    // 서비스 호출
    const result = await resubmitAssignment(
      supabase,
      user.id,
      parseResult.data,
    );

    // 성공 응답
    if (!isFailure(result)) {
      return c.json(result.data, 200);
    }

    // 에러 응답
    const errorCode = result.error;

    if (
      errorCode === submissionErrorCodes.unauthorized ||
      errorCode === submissionErrorCodes.resubmissionNotAllowed
    ) {
      return c.json(
        {
          error: {
            code: errorCode,
            message: result.message,
          },
        },
        403,
      );
    }

    if (errorCode === submissionErrorCodes.submissionNotFound) {
      return c.json(
        {
          error: {
            code: errorCode,
            message: result.message,
          },
        },
        404,
      );
    }

    if (errorCode === submissionErrorCodes.resubmissionNotRequired) {
      return c.json(
        {
          error: {
            code: errorCode,
            message: result.message,
          },
        },
        400,
      );
    }

    // 기타 에러
    return c.json(
      {
        error: {
          code: errorCode,
          message: result.message,
        },
      },
      500,
    );
  });

  // ========================================
  // Instructor Routes
  // ========================================

  /**
   * POST /instructor/courses/:courseId/assignments
   * Create assignment (Instructor only)
   */
  app.post('/instructor/courses/:courseId/assignments', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: assignmentErrorCodes.unauthorized,
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
            code: assignmentErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401,
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
            code: assignmentErrorCodes.unauthorized,
            message: '강사만 과제를 생성할 수 있습니다',
          },
        },
        403,
      );
    }

    const courseId = c.req.param('courseId');

    // Parse request body
    const body = await c.req.json();
    const { CreateAssignmentRequestSchema } = await import('./schema');
    const parseResult = CreateAssignmentRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: assignmentErrorCodes.invalidRequest,
            message: parseResult.error.errors[0].message,
          },
        },
        400,
      );
    }

    const { createAssignment } = await import('./service');
    const result = await createAssignment(supabase, userId, courseId, parseResult.data);

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
   * PATCH /instructor/assignments/:assignmentId
   * Update assignment (Instructor only)
   */
  app.patch('/instructor/assignments/:assignmentId', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: assignmentErrorCodes.unauthorized,
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
            code: assignmentErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401,
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
            code: assignmentErrorCodes.unauthorized,
            message: '강사만 과제를 수정할 수 있습니다',
          },
        },
        403,
      );
    }

    const assignmentId = c.req.param('assignmentId');

    // Parse request body
    const body = await c.req.json();
    const { UpdateAssignmentRequestSchema } = await import('./schema');
    const parseResult = UpdateAssignmentRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: assignmentErrorCodes.invalidRequest,
            message: parseResult.error.errors[0].message,
          },
        },
        400,
      );
    }

    const { updateAssignment } = await import('./service');
    const result = await updateAssignment(supabase, userId, assignmentId, parseResult.data);

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
      result.error === assignmentErrorCodes.assignmentNotFound ? 404 : 400,
    );
  });

  /**
   * PATCH /instructor/assignments/:assignmentId/status
   * Update assignment status (Instructor only)
   */
  app.patch('/instructor/assignments/:assignmentId/status', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: assignmentErrorCodes.unauthorized,
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
            code: assignmentErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401,
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
            code: assignmentErrorCodes.unauthorized,
            message: '강사만 과제 상태를 변경할 수 있습니다',
          },
        },
        403,
      );
    }

    const assignmentId = c.req.param('assignmentId');

    // Parse request body
    const body = await c.req.json();
    const { UpdateAssignmentStatusRequestSchema } = await import('./schema');
    const parseResult = UpdateAssignmentStatusRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: assignmentErrorCodes.invalidRequest,
            message: parseResult.error.errors[0].message,
          },
        },
        400,
      );
    }

    const { updateAssignmentStatus } = await import('./service');
    const result = await updateAssignmentStatus(supabase, userId, assignmentId, parseResult.data);

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
      result.error === assignmentErrorCodes.assignmentNotFound ? 404 : 400,
    );
  });

  /**
   * GET /instructor/assignments/:assignmentId/submissions
   * Get assignment submissions with filter (Instructor only)
   */
  app.get('/instructor/assignments/:assignmentId/submissions', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: assignmentErrorCodes.unauthorized,
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
            code: assignmentErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401,
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
            code: assignmentErrorCodes.unauthorized,
            message: '강사만 제출물을 조회할 수 있습니다',
          },
        },
        403,
      );
    }

    const assignmentId = c.req.param('assignmentId');

    // Parse query params
    const { SubmissionFilterQuerySchema } = await import('./schema');
    const parseResult = SubmissionFilterQuerySchema.safeParse(c.req.query());

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: assignmentErrorCodes.invalidRequest,
            message: parseResult.error.message,
          },
        },
        400,
      );
    }

    const { getAssignmentSubmissions } = await import('./service');
    const result = await getAssignmentSubmissions(
      supabase,
      userId,
      assignmentId,
      parseResult.data,
    );

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
      result.error === assignmentErrorCodes.assignmentNotFound ? 404 : 400,
    );
  });

  /**
   * GET /instructor/submissions/:submissionId
   * Get submission detail (Instructor only)
   */
  app.get('/instructor/submissions/:submissionId', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: submissionErrorCodes.unauthorized,
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
            code: submissionErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401,
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
            code: submissionErrorCodes.unauthorized,
            message: '강사만 제출물을 조회할 수 있습니다',
          },
        },
        403,
      );
    }

    const submissionId = c.req.param('submissionId');

    const { getSubmissionDetail } = await import('./service');
    const result = await getSubmissionDetail(supabase, userId, submissionId);

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
      result.error === submissionErrorCodes.submissionNotFound ? 404 : 400,
    );
  });

  /**
   * POST /instructor/submissions/:submissionId/grade
   * Grade submission (Instructor only)
   */
  app.post('/instructor/submissions/:submissionId/grade', async (c) => {
    const supabase = c.get('supabase');

    // Get current user
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json(
        {
          error: {
            code: submissionErrorCodes.unauthorized,
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
            code: submissionErrorCodes.unauthorized,
            message: '유효하지 않은 토큰입니다',
          },
        },
        401,
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
            code: submissionErrorCodes.unauthorized,
            message: '강사만 채점할 수 있습니다',
          },
        },
        403,
      );
    }

    const submissionId = c.req.param('submissionId');

    // Parse request body
    const body = await c.req.json();
    const { GradeSubmissionRequestSchema } = await import('./schema');
    const parseResult = GradeSubmissionRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: submissionErrorCodes.invalidRequest,
            message: parseResult.error.errors[0].message,
          },
        },
        400,
      );
    }

    const { gradeSubmission } = await import('./service');
    const result = await gradeSubmission(supabase, userId, submissionId, parseResult.data);

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
      result.error === submissionErrorCodes.submissionNotFound ? 404 : 400,
    );
  });
}
