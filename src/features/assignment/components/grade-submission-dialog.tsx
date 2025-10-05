'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useGradeSubmission } from '@/features/assignment/hooks/useInstructorAssignment';
import { Loader2 } from 'lucide-react';

const gradeSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  feedback: z.string().optional(),
  requireResubmission: z.boolean().default(false),
});

type GradeFormData = z.infer<typeof gradeSchema>;

interface GradeSubmissionDialogProps {
  submission: {
    id: string;
    learnerName: string;
    submittedAt: string;
    status: string;
    score: number | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GradeSubmissionDialog({
  submission,
  isOpen,
  onClose,
  onSuccess,
}: GradeSubmissionDialogProps) {
  const { toast } = useToast();
  const gradeSubmissionMutation = useGradeSubmission();
  const [requireResubmission, setRequireResubmission] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      score: submission.score ?? 0,
      feedback: '',
      requireResubmission: false,
    },
  });

  const onSubmit = async (data: GradeFormData) => {
    try {
      await gradeSubmissionMutation.mutateAsync({
        submissionId: submission.id,
        request: {
          score: data.score,
          feedback: data.feedback,
          requireResubmission: data.requireResubmission,
        },
      });

      toast({
        title: '성공',
        description: '채점이 완료되었습니다.',
      });

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: '오류',
        description: '채점 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>제출물 채점</DialogTitle>
          <DialogDescription>
            {submission.learnerName}의 제출물을 채점합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="score">점수 (0-100)</Label>
            <Input
              id="score"
              type="number"
              min={0}
              max={100}
              {...register('score')}
              placeholder="점수를 입력하세요"
            />
            {errors.score && (
              <p className="text-sm text-destructive">{errors.score.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">피드백 (선택)</Label>
            <Textarea
              id="feedback"
              {...register('feedback')}
              placeholder="학생에게 전달할 피드백을 입력하세요"
              rows={5}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requireResubmission"
              {...register('requireResubmission')}
              checked={requireResubmission}
              onChange={(e) => setRequireResubmission(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="requireResubmission" className="cursor-pointer">
              재제출 요구
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={gradeSubmissionMutation.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={gradeSubmissionMutation.isPending}>
              {gradeSubmissionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              채점 완료
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
