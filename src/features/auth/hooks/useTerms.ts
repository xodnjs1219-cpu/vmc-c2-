import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { TermsListResponse } from '@/features/auth/lib/dto';

export const useTerms = () => {
  return useQuery({
    queryKey: ['terms'],
    queryFn: async (): Promise<TermsListResponse> => {
      const response = await apiClient.get<TermsListResponse>('/auth/terms');
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
