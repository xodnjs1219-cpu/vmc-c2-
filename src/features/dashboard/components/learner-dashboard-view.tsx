'use client';

import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { DashboardOverview } from './dashboard-overview';
import { MyCoursesSection } from './my-courses-section';
import { UpcomingAssignmentsSection } from './upcoming-assignments-section';
import { RecentFeedbackSection } from './recent-feedback-section';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function LearnerDashboardView() {
  const { data: dashboard, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          대시보드 정보를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DashboardOverview dashboard={dashboard} />
      
      <div className="grid gap-6 md:grid-cols-2">
        <MyCoursesSection courses={dashboard.courses} />
        <UpcomingAssignmentsSection assignments={dashboard.upcomingAssignments} />
      </div>
      
      <RecentFeedbackSection feedback={dashboard.recentFeedback} />
    </div>
  );
}
