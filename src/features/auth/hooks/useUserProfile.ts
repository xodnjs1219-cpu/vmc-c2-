'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export type UserProfile = {
  id: string;
  name: string;
  role: 'learner' | 'instructor' | 'operator';
};

export const useUserProfile = () => {
  return useQuery<UserProfile>({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>('/auth/profile');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
