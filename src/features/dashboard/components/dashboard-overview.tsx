'use client';

import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MyCoursesSection } from './my-courses-section';
import { UpcomingAssignmentsSection } from './upcoming-assignments-section';
import { RecentFeedbackSection } from './recent-feedback-section';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';

export const DashboardOverview = () => {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>
            대시보드 데이터를 불러오는 데 실패했습니다.{' '}
            {error instanceof Error ? error.message : '다시 시도해주세요.'}
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            재시도
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-8">
      <MyCoursesSection courses={data.courses} />
      <UpcomingAssignmentsSection assignments={data.upcomingAssignments} />
      <RecentFeedbackSection feedback={data.recentFeedback} />
    </div>
  );
};
