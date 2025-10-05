'use client';

import { use } from 'react';
import { useCourse } from '@/features/course/hooks/useCourse';
import { CourseStatusManager } from '@/features/course/components/course-status-manager';
import { CourseEditForm } from '@/features/course/components/course-edit-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';

interface CourseManagePageProps {
  params: Promise<{ id: string }>;
}

export default function CourseManagePage({ params }: CourseManagePageProps) {
  const { id } = use(params);
  const { data, isLoading, error, refetch } = useCourse(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            코스로 돌아가기
          </Link>
        </Button>
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            코스로 돌아가기
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>코스 정보를 불러오는 중 오류가 발생했습니다.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              재시도
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Link>
        </Button>
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-slate-300">
          <p className="text-slate-500">코스를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (!data.isInstructor) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            코스로 돌아가기
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            이 코스를 관리할 권한이 없습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            코스로 돌아가기
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
        <p className="text-muted-foreground">코스 관리</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <CourseStatusManager course={data} />

          <Card>
            <CardHeader>
              <CardTitle>과제 관리</CardTitle>
              <CardDescription>
                과제를 추가하고 제출물을 확인합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/courses/${id}/assignments`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  과제 관리하기
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <CourseEditForm course={data} />
        </div>
      </div>
    </div>
  );
}
