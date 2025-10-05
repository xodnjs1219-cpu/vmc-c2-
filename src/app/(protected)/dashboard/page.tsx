'use client';

import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const { user } = useCurrentUser();

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
