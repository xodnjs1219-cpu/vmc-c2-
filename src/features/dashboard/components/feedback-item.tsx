'use client';

import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/date';
import type { RecentFeedback } from '@/features/dashboard/lib/dto';

type FeedbackItemProps = {
  feedback: RecentFeedback;
};

export const FeedbackItem = ({ feedback }: FeedbackItemProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-slate-900">
            {feedback.assignmentTitle}
          </h3>
          <p className="text-xs text-slate-500">
            {formatDateTime(feedback.gradedAt)}
          </p>
        </div>
        <Badge className={getScoreColor(feedback.score)}>
          {feedback.score}점
        </Badge>
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-md bg-slate-50 p-3">
        <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
        <p className="text-sm text-slate-700">{feedback.feedback}</p>
      </div>
    </div>
  );
};
