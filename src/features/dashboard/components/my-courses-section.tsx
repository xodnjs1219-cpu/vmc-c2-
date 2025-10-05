'use client';

import { BookOpen } from 'lucide-react';
import { CourseProgressCard } from './course-progress-card';
import { EmptyState } from './empty-state';
import type { DashboardCourse } from '@/features/dashboard/lib/dto';

type MyCourseSectionProps = {
  courses: DashboardCourse[];
};

export const MyCoursesSection = ({ courses }: MyCourseSectionProps) => {
  if (courses.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-xl font-semibold">내 코스</h2>
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="수강 중인 코스가 없습니다"
          description="코스 카탈로그에서 관심 있는 코스를 둘러보세요."
          actionLabel="코스 탐색하기"
          actionHref="/courses"
        />
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">내 코스</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseProgressCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
};
