'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstructorDashboard } from '@/features/dashboard/hooks/useInstructorDashboard';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { InstructorCourseInfo } from '@/features/dashboard/lib/dto';

const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    draft: { label: '작성 중', variant: 'secondary' as const },
    published: { label: '공개', variant: 'default' as const },
    archived: { label: '보관', variant: 'outline' as const },
  };

  const config = variants[status as keyof typeof variants] ?? variants.draft;

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const SubmissionStatusIcon = ({ status }: { status: string }) => {
  if (status === 'submitted')
    return <Clock className="h-4 w-4 text-yellow-500" />;
  if (status === 'graded')
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === 'resubmission_required')
    return <XCircle className="h-4 w-4 text-red-500" />;
  return null;
};

const CourseCard = ({ course }: { course: InstructorCourseInfo }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/courses/${course.id}`}>
              <CardTitle className="text-lg hover:underline cursor-pointer">
                {course.title}
              </CardTitle>
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(course.createdAt), {
                addSuffix: true,
                locale: ko,
              })}
            </p>
          </div>
          <StatusBadge status={course.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">수강생</p>
              <p className="text-lg font-semibold">{course.enrollmentCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">과제</p>
              <p className="text-lg font-semibold">{course.assignmentCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">채점 대기</p>
              <p className="text-lg font-semibold text-orange-600">
                {course.pendingGradingCount}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const InstructorDashboardView = () => {
  const { data, isLoading, isError } = useInstructorDashboard();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold">
              대시보드를 불러오는 중 오류가 발생했습니다
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              잠시 후 다시 시도해주세요
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { courses, recentSubmissions, totalPendingGrading } = data;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">강사 대시보드</h1>
          <p className="text-muted-foreground mt-1">
            코스 관리 및 채점 현황을 확인하세요
          </p>
        </div>
        <Link href="/courses/new">
          <Button>
            <BookOpen className="mr-2 h-4 w-4" />
            새 코스 만들기
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 코스</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              {courses.filter((c) => c.status === 'published').length}개 공개 중
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">채점 대기</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalPendingGrading}
            </div>
            <p className="text-xs text-muted-foreground">
              채점이 필요한 과제
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 제출물</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">최근 10개 제출물</p>
          </CardContent>
        </Card>
      </div>

      {/* Courses Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">내 코스</h2>
        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold">아직 코스가 없습니다</p>
              <p className="text-sm text-muted-foreground mt-2">
                첫 번째 코스를 만들어보세요
              </p>
              <Link href="/courses/new">
                <Button className="mt-4">코스 만들기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Submissions Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">최근 제출물</h2>
        {recentSubmissions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold">최근 제출물이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-2">
                학습자가 과제를 제출하면 여기에 표시됩니다
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentSubmissions.map((submission) => (
                  <Link
                    key={submission.id}
                    href={`/courses/${submission.courseId}/assignments/${submission.assignmentId}`}
                  >
                    <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <SubmissionStatusIcon status={submission.status} />
                            <h3 className="font-semibold">
                              {submission.assignmentTitle}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            제출자: {submission.learnerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(submission.submittedAt),
                              {
                                addSuffix: true,
                                locale: ko,
                              },
                            )}
                          </p>
                        </div>
                        {submission.status === 'submitted' && (
                          <Badge variant="outline" className="text-orange-600">
                            채점 필요
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
