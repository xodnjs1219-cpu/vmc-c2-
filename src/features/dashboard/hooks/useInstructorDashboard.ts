'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { CACHE_KEYS, CACHE_TIME } from '@/features/dashboard/constants';
import type { InstructorDashboardResponse } from '@/features/dashboard/lib/dto';

export const useInstructorDashboard = () => {
  return useQuery<InstructorDashboardResponse>({
    queryKey: [CACHE_KEYS.INSTRUCTOR_DASHBOARD],
    queryFn: async () => {
      const response = await apiClient.get<InstructorDashboardResponse>(
        '/instructor/dashboard',
      );
      return response.data;
    },
    staleTime: CACHE_TIME.STALE_TIME,
    gcTime: CACHE_TIME.CACHE_TIME,
  });
};
