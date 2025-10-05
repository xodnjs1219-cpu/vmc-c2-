import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  ResubmitAssignmentRequest,
  ResubmitAssignmentResponse,
} from '../lib/dto';

/**
 * Use Resubmit Assignment Hook
 *
 * @returns React Query mutation result
 */
export const useResubmitAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ResubmitAssignmentRequest) => {
      const response = await apiClient.put<ResubmitAssignmentResponse>(
        `/submissions/${request.submissionId}`,
        {
          textContent: request.textContent,
          link: request.link,
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate assignment detail
      queryClient.invalidateQueries({
        queryKey: ['assignments'],
      });
      // Invalidate dashboard
      queryClient.invalidateQueries({
        queryKey: ['dashboard'],
      });
    },
  });
};
