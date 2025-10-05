'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUpdateCourseStatus } from '../hooks/useInstructorCourse';
import { Loader2, CheckCircle, Archive, FileText } from 'lucide-react';
import type { Course } from '../lib/dto';

interface CourseStatusManagerProps {
  course: Course;
}

export function CourseStatusManager({ course }: CourseStatusManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const { toast } = useToast();
  const updateStatusMutation = useUpdateCourseStatus();

  const handleStatusChange = (newStatus: 'draft' | 'published' | 'archived') => {
    setTargetStatus(newStatus);
    setShowDialog(true);
  };

  const handleConfirm = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        courseId: course.id,
        request: { status: targetStatus },
      });
      toast({
        title: '성공',
        description: '코스 상태가 변경되었습니다.',
      });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: '오류',
        description:
          error instanceof Error ? error.message : '상태 변경에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'outline';
      case 'published':
        return 'default';
      case 'archived':
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
      case 'archived':
        return '보관';
      default:
        return status;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'draft':
        return '학생들에게 보이지 않습니다.';
      case 'published':
        return '학생들이 수강신청할 수 있습니다.';
      case 'archived':
        return '수강신청이 마감되었습니다.';
      default:
        return '';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>코스 상태</CardTitle>
              <CardDescription>코스의 공개 상태를 관리합니다</CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(course.status)}>
              {getStatusLabel(course.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {getStatusDescription(course.status)}
            </p>

            <div className="flex flex-wrap gap-2">
              {course.status !== 'draft' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('draft')}
                  disabled={updateStatusMutation.isPending}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  임시저장으로 전환
                </Button>
              )}
              {course.status !== 'published' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleStatusChange('published')}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  공개로 전환
                </Button>
              )}
              {course.status !== 'archived' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusChange('archived')}
                  disabled={updateStatusMutation.isPending}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  보관으로 전환
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상태 변경 확인</DialogTitle>
            <DialogDescription>
              코스 상태를 &quot;{getStatusLabel(targetStatus)}&quot;(으)로 변경하시겠습니까?
              <br />
              {getStatusDescription(targetStatus)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={updateStatusMutation.isPending}
            >
              취소
            </Button>
            <Button onClick={handleConfirm} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
