'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Course } from '../lib/dto';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline">{course.category.name}</Badge>
            <Badge variant="secondary">{course.difficulty.name}</Badge>
          </div>
          <CardTitle className="line-clamp-2">{course.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
            {course.description}
          </p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{course.instructor.name}</span>
            <span>{course.enrollmentCount}명 수강</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
