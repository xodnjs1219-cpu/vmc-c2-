import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { EnrollRequest, EnrollResponse } from '../lib/dto';

export const useEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: EnrollRequest): Promise<EnrollResponse> => {
      const response = await apiClient.post<EnrollResponse>(
        '/enrollments',
        request
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
};
