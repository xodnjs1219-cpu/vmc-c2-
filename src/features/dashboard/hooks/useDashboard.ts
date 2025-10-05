'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { CACHE_KEYS, CACHE_TIME } from '@/features/dashboard/constants';
import type { DashboardResponse } from '@/features/dashboard/lib/dto';

export const useDashboard = () => {
  return useQuery<DashboardResponse>({
    queryKey: [CACHE_KEYS.DASHBOARD],
    queryFn: async () => {
      const response = await apiClient.get<DashboardResponse>('/dashboard');
      return response.data;
    },
    staleTime: CACHE_TIME.STALE_TIME,
    gcTime: CACHE_TIME.CACHE_TIME,
  });
};
