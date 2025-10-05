'use client';

import Link from 'next/link';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date';
import type { UpcomingAssignment } from '@/features/dashboard/lib/dto';

type AssignmentItemProps = {
  assignment: UpcomingAssignment;
};

export const AssignmentItem = ({ assignment }: AssignmentItemProps) => {
  const isUrgent = assignment.daysRemaining <= 3;

  return (
    <Link
      href={`/courses/${assignment.courseId}/assignments/${assignment.id}`}
      className="block"
    >
      <div className="flex items-start justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-medium text-slate-900">{assignment.title}</h3>
            {isUrgent && <AlertTriangle className="h-4 w-4 text-orange-500" />}
          </div>
          <p className="text-sm text-slate-600">{assignment.courseTitle}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>{formatDate(assignment.dueDate)}</span>
            <Badge variant={isUrgent ? 'destructive' : 'secondary'}>
              {assignment.daysRemaining === 0
                ? '오늘 마감'
                : `${assignment.daysRemaining}일 남음`}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
};
