'use client';

import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import { InstructorDashboardView } from '@/features/dashboard/components/instructor-dashboard-view';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useUserProfile } from '@/features/auth/hooks/useUserProfile';
import { Skeleton } from '@/components/ui/skeleton';

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Instructor Dashboard
  if (profile?.role === 'instructor') {
    return <InstructorDashboardView />;
  }

  // Learner Dashboard
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">대시보드</h1>
        <p className="text-slate-500">
          {user?.email ?? '알 수 없는 사용자'} 님, 환영합니다.
        </p>
      </header>
      <DashboardOverview />
    </div>
  );
}
