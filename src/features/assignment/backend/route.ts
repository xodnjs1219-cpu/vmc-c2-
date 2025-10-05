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
}
