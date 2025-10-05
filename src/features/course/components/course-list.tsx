'use client';

import { useSearchParams } from 'next/navigation';
import { CourseCard } from './course-card';
import { useCourses } from '../hooks/useCourses';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function CourseList() {
  const searchParams = useSearchParams();

  const query = {
    search: searchParams.get('search') || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    difficultyId: searchParams.get('difficultyId') || undefined,
    sortBy: (searchParams.get('sortBy') as 'latest' | 'popular') || 'latest',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 12,
  };

  const { data, isLoading, error, refetch } = useCourses(query);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-lg bg-muted"
          ></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          코스 목록을 불러오는 중 오류가 발생했습니다.
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
            재시도
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || data.courses.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={data.page <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', String(data.page - 1));
              window.location.href = `?${params.toString()}`;
            }}
          >
            이전
          </Button>
          <div className="flex items-center gap-2 px-4">
            <span className="text-sm text-muted-foreground">
              {data.page} / {data.totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            disabled={data.page >= data.totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', String(data.page + 1));
              window.location.href = `?${params.toString()}`;
            }}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
