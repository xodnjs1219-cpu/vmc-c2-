import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { UnenrollRequest, UnenrollResponse } from '../lib/dto';

export const useUnenrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      request: UnenrollRequest
    ): Promise<UnenrollResponse> => {
      const response = await apiClient.delete<UnenrollResponse>(
        '/enrollments',
        {
          data: request,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
};
