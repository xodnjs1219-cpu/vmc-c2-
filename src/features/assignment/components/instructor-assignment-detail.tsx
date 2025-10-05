'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  useInstructorAssignmentDetail,
  useAssignmentSubmissions,
  useUpdateAssignmentStatus,
} from '../hooks/useInstructorAssignment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { GradeSubmissionDialog } from './grade-submission-dialog';
import {
  AlertCircle,
  Calendar,
  FileText,
  RefreshCw,
  Star,
  Clock,
  Users,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { SubmissionFilterQuery } from '../lib/dto';

interface InstructorAssignmentDetailProps {
  courseId: string;
  assignmentId: string;
}

export function InstructorAssignmentDetail({ courseId, assignmentId }: InstructorAssignmentDetailProps) {
  const [filter, setFilter] = useState<SubmissionFilterQuery['filter']>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: assignment, isLoading, error, refetch } = useInstructorAssignmentDetail(assignmentId);
  const { data: submissions, isLoading: submissionsLoading, refetch: refetchSubmissions } = useAssignmentSubmissions(
    assignmentId,
    filter,
    !!assignmentId
  );
  const updateStatusMutation = useUpdateAssignmentStatus();

  const handleSubmissionClick = (submission: any) => {
    setSelectedSubmission(submission);
    setIsGradeDialogOpen(true);
  };

  const handleGradeSuccess = () => {
    refetchSubmissions();
    refetch();
  };

  const handleStatusChange = async (newStatus: 'draft' | 'published' | 'closed') => {
    try {
      await updateStatusMutation.mutateAsync({
        assignmentId,
        request: { status: newStatus },
      });
      toast({
        title: '성공',
        description: '과제 상태가 변경되었습니다.',
      });
      refetch();
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '상태 변경에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Card className="w-full">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${courseId}/assignments`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Link>
        </Button>
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
      </div>
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'outline';
      case 'published':
        return 'default';
      case 'closed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return '임시저장';
      case 'published':
        return '공개';
      case 'closed':
        return '마감';
      default:
        return status;
    }
  };

  const submissionRate = assignment.totalStudents > 0
    ? Math.round((assignment.submissionCount / assignment.totalStudents) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/courses/${courseId}/assignments`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로 돌아가기
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                <Badge variant={getStatusBadgeVariant(assignment.status)}>
                  {getStatusLabel(assignment.status)}
                </Badge>
              </div>
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
          {/* 상태 변경 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">과제 상태</label>
            <Select
              value={assignment.status}
              onValueChange={(value) => handleStatusChange(value as 'draft' | 'published' | 'closed')}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">임시저장</SelectItem>
                <SelectItem value="published">공개</SelectItem>
                <SelectItem value="closed">마감</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* 제출 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <Users className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{assignment.submissionCount}</p>
              <p className="text-sm text-muted-foreground">제출 완료</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <Clock className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{assignment.totalStudents - assignment.submissionCount}</p>
              <p className="text-sm text-muted-foreground">미제출</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <CheckCircle className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{submissionRate}%</p>
              <p className="text-sm text-muted-foreground">제출률</p>
            </div>
          </div>

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

      {/* 제출물 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>제출물 목록</CardTitle>
            <Select value={filter} onValueChange={(value) => setFilter(value as SubmissionFilterQuery['filter'])}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">채점 대기</SelectItem>
                <SelectItem value="late">지각 제출</SelectItem>
                <SelectItem value="resubmission">재제출 필요</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {submissionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !submissions || submissions.submissions.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
              제출물이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.submissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => handleSubmissionClick(submission)}
                  className="block p-4 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{submission.learnerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(submission.submittedAt), 'PPP HH:mm', { locale: ko })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.isLate && (
                        <Badge variant="outline" className="text-orange-600">
                          지각
                        </Badge>
                      )}
                      {submission.status === 'submitted' && (
                        <Badge variant="secondary">채점 대기</Badge>
                      )}
                      {submission.status === 'graded' && submission.score !== null && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {submission.score}점
                        </Badge>
                      )}
                      {submission.status === 'resubmission_required' && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          재제출 필요
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 채점 다이얼로그 */}
      {selectedSubmission && (
        <GradeSubmissionDialog
          submission={selectedSubmission}
          isOpen={isGradeDialogOpen}
          onClose={() => setIsGradeDialogOpen(false)}
          onSuccess={handleGradeSuccess}
        />
      )}
    </div>
  );
}
