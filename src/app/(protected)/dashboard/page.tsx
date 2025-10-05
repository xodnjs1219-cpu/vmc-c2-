'use client';

import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import { InstructorDashboardView } from '@/features/dashboard/components/instructor-dashboard-view';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useUserProfile } from '@/features/auth/hooks/useUserProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useUserProfile();

  // 로딩 중
  if (isUserLoading || isProfileLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // 프로필 로드 실패
  if (profileError || !profile) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">대시보드</h1>
          <p className="mt-2 text-slate-600">
            {user?.email ?? '알 수 없는 사용자'} 님, 환영합니다.
          </p>
        </header>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            프로필 정보를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Instructor Dashboard
  if (profile.role === 'instructor') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">강사 대시보드</h1>
          <p className="mt-2 text-slate-600">
            {profile.name ?? user?.email ?? '알 수 없는 사용자'} 님, 환영합니다.
          </p>
        </header>
        <InstructorDashboardView />
      </div>
    );
  }

  // Learner Dashboard
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">학습자 대시보드</h1>
        <p className="mt-2 text-slate-600">
          {profile.name ?? user?.email ?? '알 수 없는 사용자'} 님, 환영합니다.
        </p>
      </header>
      <DashboardOverview />
    </div>
  );
}
