'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatProgress, getProgressColor } from '@/lib/progress';
import type { DashboardCourse } from '@/features/dashboard/lib/dto';

type CourseProgressCardProps = {
  course: DashboardCourse;
};

export const CourseProgressCard = ({ course }: CourseProgressCardProps) => {
  const progressColor = getProgressColor(course.progress.percentage);

  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{course.title}</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">{course.category}</Badge>
              <Badge variant="outline">{course.difficulty}</Badge>
            </div>
          </div>
          <CardDescription className="line-clamp-2">
            {course.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">진행률</span>
              <span className="font-semibold">
                {formatProgress(course.progress.percentage)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full transition-all ${progressColor}`}
                style={{ width: `${course.progress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {course.progress.completed}/{course.progress.total} 과제 완료
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
