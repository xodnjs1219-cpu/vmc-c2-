'use client';

import { use } from 'react';
import { AssignmentDetail } from '@/features/assignment/components/assignment-detail';

interface AssignmentDetailPageProps {
  params: Promise<{
    id: string;
    assignmentId: string;
  }>;
}

export default function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { id: courseId, assignmentId } = use(params);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <AssignmentDetail courseId={courseId} assignmentId={assignmentId} />
    </div>
  );
}
