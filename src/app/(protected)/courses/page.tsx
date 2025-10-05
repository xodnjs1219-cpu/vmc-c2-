'use client';

import { CourseFilter } from '@/features/course/components/course-filter';
import { CourseList } from '@/features/course/components/course-list';

export default function CoursesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">코스 카탈로그</h1>
        <p className="mt-2 text-muted-foreground">
          다양한 코스를 탐색하고 수강신청하세요
        </p>
      </div>

      <CourseFilter />
      <CourseList />
    </div>
  );
}
