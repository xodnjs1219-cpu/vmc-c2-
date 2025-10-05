'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAssignmentDetail } from '../hooks/useAssignmentDetail';
import { AssignmentStatus } from './assignment-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  FileText,
  Link as LinkIcon,
  RefreshCw,
  Star,
  Clock,
} from 'lucide-react';

interface AssignmentDetailProps {
  courseId: string;
  assignmentId: string;
}

export function AssignmentDetail({ courseId, assignmentId }: AssignmentDetailProps) {
  const { data: assignment, isLoading, error, refetch } = useAssignmentDetail(courseId, assignmentId);

  // 로딩 상태
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>과제를 불러올 수 없습니다</AlertTitle>
        <AlertDescription className="mt-2">
          {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
        </AlertDescription>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          다시 시도
        </Button>
      </Alert>
    );
  }

  if (!assignment) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>과제를 찾을 수 없습니다</AlertTitle>
      </Alert>
    );
  }

  const formattedDueDate = format(new Date(assignment.dueDate), 'PPP (eee) HH:mm', { locale: ko });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                마감일: {formattedDueDate}
              </CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              배점: {assignment.weight}%
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 과제 상태 */}
          <AssignmentStatus
            status={assignment.status}
            dueDate={assignment.dueDate}
            canSubmit={assignment.canSubmit}
            isLate={assignment.isLate}
            submitDisabledReason={assignment.submitDisabledReason}
          />

          <Separator />

          {/* 과제 설명 */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              과제 설명
            </h3>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-muted-foreground">
              {assignment.description}
            </div>
          </div>

          <Separator />

          {/* 정책 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                지각 제출: {assignment.allowLate ? (
                  <span className="text-green-600">허용</span>
                ) : (
                  <span className="text-red-600">불가</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                재제출: {assignment.allowResubmission ? (
                  <span className="text-green-600">허용</span>
                ) : (
                  <span className="text-red-600">불가</span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 제출 이력 */}
      {assignment.submission && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              제출 이력
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 제출 상태 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">상태:</span>
              {assignment.submission.status === 'submitted' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  채점 대기 중
                </Badge>
              )}
              {assignment.submission.status === 'graded' && (
                <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3" />
                  채점 완료
                </Badge>
              )}
              {assignment.submission.status === 'resubmission_required' && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                  <RefreshCw className="h-3 w-3" />
                  재제출 요청
                </Badge>
              )}
              {assignment.submission.isLate && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  지각 제출
                </Badge>
              )}
            </div>

            {/* 제출 내용 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">제출 내용:</div>
              <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {assignment.submission.textContent}
              </div>
            </div>

            {/* 링크 */}
            {assignment.submission.link && (
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  첨부 링크:
                </div>
                <a
                  href={assignment.submission.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {assignment.submission.link}
                </a>
              </div>
            )}

            {/* 제출 시간 */}
            <div className="text-xs text-muted-foreground">
              제출 일시: {format(new Date(assignment.submission.submittedAt), 'PPP (eee) HH:mm', { locale: ko })}
            </div>

            {/* 채점 결과 */}
            {assignment.submission.status === 'graded' && assignment.submission.score !== null && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-semibold text-green-900">
                    점수: {assignment.submission.score}점
                  </span>
                </div>
                {assignment.submission.feedback && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-900">피드백:</div>
                    <div className="text-sm text-green-800 whitespace-pre-wrap">
                      {assignment.submission.feedback}
                    </div>
                  </div>
                )}
                {assignment.submission.gradedAt && (
                  <div className="text-xs text-green-700">
                    채점 일시: {format(new Date(assignment.submission.gradedAt), 'PPP (eee) HH:mm', { locale: ko })}
                  </div>
                )}
              </div>
            )}

            {/* 재제출 요청 */}
            {assignment.submission.status === 'resubmission_required' && assignment.submission.feedback && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-yellow-600" />
                  <span className="text-lg font-semibold text-yellow-900">재제출이 요청되었습니다</span>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-yellow-900">피드백:</div>
                  <div className="text-sm text-yellow-800 whitespace-pre-wrap">
                    {assignment.submission.feedback}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 제출 버튼 영역 (미제출 + 제출 가능) */}
      {!assignment.submission && assignment.canSubmit && (
        <Card>
          <CardContent className="pt-6">
            <Button size="lg" className="w-full">
              과제 제출하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 재제출 버튼 영역 */}
      {assignment.submission?.status === 'resubmission_required' && assignment.canSubmit && (
        <Card>
          <CardContent className="pt-6">
            <Button size="lg" className="w-full" variant="default">
              과제 재제출하기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
