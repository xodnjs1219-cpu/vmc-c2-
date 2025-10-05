'use client';

import { CourseCreateForm } from '@/features/course/components/course-create-form';
import { useCourseMetadata } from '@/features/course/hooks/useCourseMetadata';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type CourseNewPageProps = {
  params: Promise<Record<string, never>>;
};

export default function CourseNewPage({ params }: CourseNewPageProps) {
  void params;
  const { data, isLoading, error, refetch } = useCourseMetadata();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Link>
        </Button>
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Link>
        </Button>
        <header>
          <h1 className="text-3xl font-bold text-slate-900">새 코스 만들기</h1>
          <p className="mt-2 text-slate-600">
            새로운 코스를 만들어 학습자들과 공유하세요
          </p>
        </header>
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>코스 정보를 불러오는 중 오류가 발생했습니다.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              재시도
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/courses">
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로 돌아가기
        </Link>
      </Button>
      <header>
        <h1 className="text-3xl font-bold text-slate-900">새 코스 만들기</h1>
        <p className="mt-2 text-slate-600">
          새로운 코스를 만들어 학습자들과 공유하세요
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>코스 기본 정보</CardTitle>
          <CardDescription>
            코스의 제목, 설명, 카테고리 등 기본 정보를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseCreateForm
            categories={data.categories}
            difficulties={data.difficulties}
          />
        </CardContent>
      </Card>
    </div>
  );
}
