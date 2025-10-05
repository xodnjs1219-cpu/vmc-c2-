'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSubmitAssignment } from '../hooks/useSubmitAssignment';
import { useResubmitAssignment } from '../hooks/useResubmitAssignment';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import { AlertCircle, Clock, Send, RefreshCw } from 'lucide-react';
import type { SubmissionStatus } from '../lib/dto';

const submissionFormSchema = z.object({
  textContent: z.string().min(1, '과제 내용을 입력해주세요'),
  link: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || /^https?:\/\/.+/.test(val),
      '올바른 URL 형식을 입력해주세요 (http:// 또는 https://)',
    ),
});

type SubmissionFormValues = z.infer<typeof submissionFormSchema>;

interface SubmissionFormProps {
  assignmentId: string;
  assignmentTitle: string;
  dueDate: string;
  allowLate: boolean;
  canSubmit: boolean;
  submitDisabledReason?: string;
  submission?: SubmissionStatus | null;
  onSuccess?: () => void;
}

export function SubmissionForm({
  assignmentId,
  assignmentTitle,
  dueDate,
  allowLate,
  canSubmit,
  submitDisabledReason,
  submission,
  onSuccess,
}: SubmissionFormProps) {
  const { toast } = useToast();
  const submitMutation = useSubmitAssignment();
  const resubmitMutation = useResubmitAssignment();

  const isResubmit = submission?.status === 'resubmission_required';
  const isLate = new Date() > new Date(dueDate);

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      textContent: submission?.textContent ?? '',
      link: submission?.link ?? '',
    },
  });

  const onSubmit = async (values: SubmissionFormValues) => {
    try {
      if (isResubmit && submission) {
        // 재제출
        await resubmitMutation.mutateAsync({
          submissionId: submission.id,
          textContent: values.textContent,
          link: values.link || null,
        });

        toast({
          title: '재제출 완료',
          description: '과제가 재제출되었습니다.',
        });
      } else {
        // 최초 제출
        await submitMutation.mutateAsync({
          assignmentId,
          textContent: values.textContent,
          link: values.link || null,
        });

        toast({
          title: isLate && allowLate ? '지각 제출 완료' : '제출 완료',
          description: isLate && allowLate
            ? '과제가 지각 제출되었습니다.'
            : '과제가 정상 제출되었습니다.',
        });

        form.reset();
      }

      onSuccess?.();
    } catch (error) {
      const message = extractApiErrorMessage(error, '제출 중 오류가 발생했습니다');
      toast({
        title: '제출 실패',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const isPending = submitMutation.isPending || resubmitMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isResubmit ? (
            <>
              <RefreshCw className="h-5 w-5" />
              과제 재제출
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              과제 제출
            </>
          )}
        </CardTitle>
        <CardDescription>
          {assignmentTitle} - 마감일: {new Date(dueDate).toLocaleString('ko-KR')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 지각 경고 */}
        {isLate && allowLate && canSubmit && (
          <Alert variant="default" className="bg-yellow-50 border-yellow-200">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              마감일이 지났습니다. 지각 제출로 기록됩니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 제출 불가 안내 */}
        {!canSubmit && submitDisabledReason && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitDisabledReason}</AlertDescription>
          </Alert>
        )}

        {/* 제출 폼 */}
        {canSubmit && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 과제 내용 */}
              <FormField
                control={form.control}
                name="textContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>과제 내용 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="과제 내용을 입력해주세요..."
                        className="min-h-[200px] resize-y"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      필수 입력 항목입니다. 과제 요구사항에 맞게 작성해주세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 링크 (선택) */}
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>첨부 링크 (선택)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      관련 자료나 결과물 링크가 있다면 입력해주세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 제출 버튼 */}
              <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {isResubmit ? '재제출 중...' : '제출 중...'}
                  </>
                ) : (
                  <>
                    {isResubmit ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        재제출하기
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        제출하기
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
