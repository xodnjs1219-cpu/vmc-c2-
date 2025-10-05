'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CourseFilter } from '@/features/course/components/course-filter';
import { CourseList } from '@/features/course/components/course-list';
import { useUserProfile } from '@/features/auth/hooks/useUserProfile';
import { Button } from '@/components/ui/button';

type CoursesPageProps = {
  params: Promise<Record<string, never>>;
};

export default function CoursesPage({ params }: CoursesPageProps) {
  void params;
  const { data: profile } = useUserProfile();
  const isInstructor = profile?.role === 'instructor';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">코스 카탈로그</h1>
          <p className="mt-2 text-slate-600">
            다양한 코스를 탐색하고 수강신청하세요
          </p>
        </header>
        {isInstructor && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              새 코스 만들기
            </Link>
          </Button>
        )}
      </div>

      <CourseFilter />
      <CourseList />
    </div>
  );
}
