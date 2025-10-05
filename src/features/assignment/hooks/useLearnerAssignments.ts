'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { LearnerAssignmentListResponse } from '../lib/dto';

export const useLearnerAssignments = (courseId: string, enabled = true) => {
  return useQuery<LearnerAssignmentListResponse>({
    queryKey: ['learner', 'course', courseId, 'assignments'],
    queryFn: async () => {
      const response = await apiClient.get<LearnerAssignmentListResponse>(
        `/courses/${courseId}/assignments`,
      );
      return response.data;
    },
    enabled,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
