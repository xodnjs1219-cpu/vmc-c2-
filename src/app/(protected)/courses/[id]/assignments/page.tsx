'use client';

import { use } from 'react';
import { useCourse } from '@/features/course/hooks/useCourse';
import { useCourseAssignments } from '@/features/assignment/hooks/useInstructorAssignment';
import { useLearnerAssignments } from '@/features/assignment/hooks/useLearnerAssignments';
import { AssignmentCreateDialog } from '@/features/assignment/components/assignment-create-dialog';
import { LearnerAssignmentList } from '@/features/assignment/components/learner-assignment-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AssignmentsPageProps {
  params: Promise<{ id: string }>;
}

export default function AssignmentsPage({ params }: AssignmentsPageProps) {
  const { id } = use(params);
  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(id);
  
  const isInstructor = course?.isInstructor;

  // 강사용 과제 목록 - 강사일 때만 활성화
  const { data: instructorAssignments, isLoading: instructorLoading, error: instructorError } = 
    useCourseAssignments(id, isInstructor === true);
  
  // 학생용 과제 목록 - 학생일 때만 활성화
  const { data: learnerAssignments, isLoading: learnerLoading, error: learnerError } = 
    useLearnerAssignments(id, isInstructor === false);

  const assignments = isInstructor ? instructorAssignments : learnerAssignments;
  const assignmentsLoading = isInstructor ? instructorLoading : learnerLoading;
  const assignmentsError = isInstructor ? instructorError : learnerError;

  if (courseLoading || assignmentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-1/2" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (courseError || !course) {
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
            코스 정보를 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (assignmentsError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${id}/manage`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            코스 관리로 돌아가기
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            과제 목록을 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'outline';
      case 'published':
        return 'default';
      case 'closed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return '임시저장';
      case 'published':
        return '공개';
      case 'closed':
        return '마감';
      default:
        return status;
    }
  };

  // 학생용 뷰
  if (!isInstructor) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            코스로 돌아가기
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground">과제 목록</p>
        </div>

        {learnerAssignments && (
          <LearnerAssignmentList 
            courseId={id} 
            assignments={learnerAssignments.assignments} 
          />
        )}
      </div>
    );
  }

  // 강사용 뷰
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${id}/manage`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            코스 관리로 돌아가기
          </Link>
        </Button>
        <AssignmentCreateDialog courseId={id} />
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
        <p className="text-muted-foreground">과제 관리</p>
      </div>

      {!instructorAssignments || instructorAssignments.assignments.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">과제가 없습니다</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                새 과제를 추가하여 시작하세요
              </p>
              <div className="mt-6">
                <AssignmentCreateDialog courseId={id} />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {instructorAssignments.assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{assignment.title}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(assignment.status)}>
                        {getStatusLabel(assignment.status)}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        마감: {format(new Date(assignment.dueDate), 'PPP', { locale: ko })}
                      </span>
                      <span>비중: {assignment.weight}%</span>
                    </CardDescription>
                  </div>
                  <Button asChild>
                    <Link href={`/courses/${id}/assignments/${assignment.id}`}>
                      상세보기
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>제출: {assignment.submissionCount} / {assignment.totalStudents}</span>
                  </div>
                  <div>
                    제출률: {assignment.totalStudents > 0 
                      ? Math.round((assignment.submissionCount / assignment.totalStudents) * 100)
                      : 0}%
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
