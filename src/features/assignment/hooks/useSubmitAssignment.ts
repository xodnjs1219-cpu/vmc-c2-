import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  SubmitAssignmentRequest,
  SubmitAssignmentResponse,
} from '../lib/dto';

/**
 * Use Submit Assignment Hook
 *
 * @returns React Query mutation result
 */
export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SubmitAssignmentRequest) => {
      const response = await apiClient.post<SubmitAssignmentResponse>(
        '/submissions',
        request,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate assignment detail to reflect submission status
      queryClient.invalidateQueries({
        queryKey: ['assignments'],
      });
      // Invalidate dashboard queries
      queryClient.invalidateQueries({
        queryKey: ['dashboard'],
      });
    },
  });
};
