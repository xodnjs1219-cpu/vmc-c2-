'use client';

import { MessageCircle } from 'lucide-react';
import { FeedbackItem } from './feedback-item';
import { EmptyState } from './empty-state';
import type { RecentFeedback } from '@/features/dashboard/lib/dto';

type RecentFeedbackSectionProps = {
  feedback: RecentFeedback[];
};

export const RecentFeedbackSection = ({
  feedback,
}: RecentFeedbackSectionProps) => {
  if (feedback.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-xl font-semibold">최근 피드백</h2>
        <EmptyState
          icon={<MessageCircle className="h-12 w-12" />}
          title="아직 받은 피드백이 없습니다"
          description="과제를 제출하고 강사의 피드백을 받아보세요."
        />
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">최근 피드백</h2>
      <div className="space-y-3">
        {feedback.map((item) => (
          <FeedbackItem key={item.id} feedback={item} />
        ))}
      </div>
    </section>
  );
};
