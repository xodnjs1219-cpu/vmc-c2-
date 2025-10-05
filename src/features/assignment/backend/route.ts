import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { isFailure } from '@/backend/http/result';
import { assignmentErrorCodes } from './error';
import { getAssignmentDetail } from './service';
import { AssignmentDetailParamsSchema } from './schema';

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
}
