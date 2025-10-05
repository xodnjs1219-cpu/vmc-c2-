'use client';

import { use } from 'react';
import { useCourse } from '@/features/course/hooks/useCourse';
import { AssignmentDetail } from '@/features/assignment/components/assignment-detail';
import { InstructorAssignmentDetail } from '@/features/assignment/components/instructor-assignment-detail';
import { Skeleton } from '@/components/ui/skeleton';

interface AssignmentDetailPageProps {
  params: Promise<{
    id: string;
    assignmentId: string;
  }>;
}

export default function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { id: courseId, assignmentId } = use(params);
  const { data: course, isLoading } = useCourse(courseId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-10 w-40 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isInstructor = course?.isInstructor;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {isInstructor ? (
        <InstructorAssignmentDetail courseId={courseId} assignmentId={assignmentId} />
      ) : (
        <AssignmentDetail courseId={courseId} assignmentId={assignmentId} />
      )}
    </div>
  );
}
