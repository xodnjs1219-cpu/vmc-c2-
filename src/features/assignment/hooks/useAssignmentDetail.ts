import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AssignmentDetail } from '../lib/dto';

/**
 * Use Assignment Detail Hook
 *
 * @param courseId - Course ID
 * @param assignmentId - Assignment ID
 * @returns React Query result
 */
export const useAssignmentDetail = (
  courseId: string,
  assignmentId: string,
) => {
  return useQuery({
    queryKey: ['assignments', courseId, assignmentId],
    queryFn: async () => {
      const response = await apiClient.get<AssignmentDetail>(
        `/courses/${courseId}/assignments/${assignmentId}`,
      );
      return response.data;
    },
    enabled: !!courseId && !!assignmentId,
  });
};
