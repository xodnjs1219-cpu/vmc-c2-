'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useEnrollment } from '../hooks/useEnrollment';
import { useUnenrollment } from '../hooks/useUnenrollment';
import { ENROLLMENT_MESSAGES } from '../constants';
import { Loader2 } from 'lucide-react';

interface EnrollmentButtonProps {
  courseId: string;
  isEnrolled: boolean;
}

export function EnrollmentButton({
  courseId,
  isEnrolled,
}: EnrollmentButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const enrollmentMutation = useEnrollment();
  const unenrollmentMutation = useUnenrollment();

  const isPending =
    enrollmentMutation.isPending || unenrollmentMutation.isPending;

  const handleEnroll = async () => {
    try {
      await enrollmentMutation.mutateAsync({ courseId });
      toast({
        title: '성공',
        description: ENROLLMENT_MESSAGES.ENROLL_SUCCESS,
      });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: '오류',
        description:
          error instanceof Error
            ? error.message
            : '수강신청에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleUnenroll = async () => {
    try {
      await unenrollmentMutation.mutateAsync({ courseId });
      toast({
        title: '성공',
        description: ENROLLMENT_MESSAGES.UNENROLL_SUCCESS,
      });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: '오류',
        description:
          error instanceof Error
            ? error.message
            : '수강취소에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleClick = () => {
    setShowDialog(true);
  };

  const handleConfirm = () => {
    if (isEnrolled) {
      handleUnenroll();
    } else {
      handleEnroll();
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isPending}
        variant={isEnrolled ? 'outline' : 'default'}
        className="w-full"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEnrolled ? '수강취소' : '수강신청'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEnrolled ? '수강취소 확인' : '수강신청 확인'}
            </DialogTitle>
            <DialogDescription>
              {isEnrolled
                ? ENROLLMENT_MESSAGES.UNENROLL_CONFIRM
                : ENROLLMENT_MESSAGES.ENROLL_CONFIRM}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
