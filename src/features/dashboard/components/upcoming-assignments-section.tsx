'use client';

import { Calendar } from 'lucide-react';
import { AssignmentItem } from './assignment-item';
import { EmptyState } from './empty-state';
import type { UpcomingAssignment } from '@/features/dashboard/lib/dto';

type UpcomingAssignmentsSectionProps = {
  assignments: UpcomingAssignment[];
};

export const UpcomingAssignmentsSection = ({
  assignments,
}: UpcomingAssignmentsSectionProps) => {
  if (assignments.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-xl font-semibold">마감 임박 과제</h2>
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="마감 임박 과제가 없습니다"
          description="모든 과제를 제출했거나 마감일이 충분히 남아있습니다."
        />
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">
        마감 임박 과제 <span className="text-slate-500">({assignments.length})</span>
      </h2>
      <div className="space-y-3">
        {assignments.map((assignment) => (
          <AssignmentItem key={assignment.id} assignment={assignment} />
        ))}
      </div>
    </section>
  );
};
