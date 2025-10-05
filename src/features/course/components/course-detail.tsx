'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Course } from '../lib/dto';
import { EnrollmentButton } from '@/features/enrollment/components/enrollment-button';
import { Settings, ClipboardList } from 'lucide-react';
import Link from 'next/link';

interface CourseDetailProps {
  course: Course;
}

export function CourseDetail({ course }: CourseDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline">{course.category.name}</Badge>
            <Badge variant="secondary">{course.difficulty.name}</Badge>
            <Badge variant="default">{course.status}</Badge>
          </div>
          <CardTitle className="text-3xl">{course.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">강사</p>
              <p className="font-medium">{course.instructor.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">수강생</p>
              <p className="font-medium">{course.enrollmentCount}명</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 font-semibold">코스 소개</h3>
            <p className="text-muted-foreground">{course.description}</p>
          </div>

          {course.curriculum && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold">커리큘럼</h3>
                <div className="whitespace-pre-wrap text-muted-foreground">
                  {course.curriculum}
                </div>
              </div>
            </>
          )}

          <Separator />

          {course.isInstructor ? (
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/courses/${course.id}/manage`}>
                  <Settings className="mr-2 h-4 w-4" />
                  코스 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/courses/${course.id}/assignments`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  과제 관리
                </Link>
              </Button>
            </div>
          ) : course.isEnrolled ? (
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/courses/${course.id}/assignments`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  과제 보기
                </Link>
              </Button>
              <EnrollmentButton
                courseId={course.id}
                isEnrolled={true}
              />
            </div>
          ) : (
            <EnrollmentButton
              courseId={course.id}
              isEnrolled={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
