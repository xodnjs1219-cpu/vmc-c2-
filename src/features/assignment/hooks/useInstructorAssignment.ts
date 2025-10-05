'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  CreateAssignmentRequest,
  CreateAssignmentResponse,
  UpdateAssignmentRequest,
  UpdateAssignmentStatusRequest,
  SubmissionFilterQuery,
  SubmissionListResponse,
} from '@/features/assignment/lib/dto';

export const useCreateAssignment = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation<CreateAssignmentResponse, Error, CreateAssignmentRequest>({
    mutationFn: async (request: CreateAssignmentRequest) => {
      const response = await apiClient.post<CreateAssignmentResponse>(
        `/instructor/courses/${courseId}/assignments`,
        request,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { assignmentId: string; request: UpdateAssignmentRequest }
  >({
    mutationFn: async ({ assignmentId, request }) => {
      await apiClient.patch(`/instructor/assignments/${assignmentId}`, request);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignmentId],
      });
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
    },
  });
};

export const useUpdateAssignmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { assignmentId: string; request: UpdateAssignmentStatusRequest }
  >({
    mutationFn: async ({ assignmentId, request }) => {
      await apiClient.patch(
        `/instructor/assignments/${assignmentId}/status`,
        request,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignmentId],
      });
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
    },
  });
};

export const useAssignmentSubmissions = (
  assignmentId: string,
  filter: SubmissionFilterQuery['filter'] = 'all',
) => {
  return useQuery<SubmissionListResponse>({
    queryKey: ['instructor', 'assignment', assignmentId, 'submissions', filter],
    queryFn: async () => {
      const response = await apiClient.get<SubmissionListResponse>(
        `/instructor/assignments/${assignmentId}/submissions`,
        { params: { filter } },
      );
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  });
};
