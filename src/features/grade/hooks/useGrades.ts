import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { GradesResponse } from '@/features/grade/lib/dto';

export const useGrades = () => {
  return useQuery({
    queryKey: ['grades'],
    queryFn: async (): Promise<GradesResponse> => {
      const response = await apiClient.get<GradesResponse>('/grades');
      return response.data;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
};
