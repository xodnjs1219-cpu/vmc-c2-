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
  AssignmentListResponse,
} from '@/features/assignment/lib/dto';

export const useCourseAssignments = (courseId: string, enabled = true) => {
  return useQuery<AssignmentListResponse>({
    queryKey: ['instructor', 'course', courseId, 'assignments'],
    queryFn: async () => {
      const response = await apiClient.get<AssignmentListResponse>(
        `/instructor/courses/${courseId}/assignments`,
      );
      return response.data;
    },
    enabled,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useInstructorAssignmentDetail = (assignmentId: string) => {
  return useQuery<import('@/features/assignment/lib/dto').InstructorAssignmentDetail>({
    queryKey: ['instructor', 'assignment', assignmentId],
    queryFn: async () => {
      const response = await apiClient.get<import('@/features/assignment/lib/dto').InstructorAssignmentDetail>(
        `/instructor/assignments/${assignmentId}`,
      );
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

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
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', courseId, 'assignments'] });
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
  enabled = true,
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
    enabled: enabled && !!assignmentId,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

export const useSubmissionDetail = (submissionId: string) => {
  return useQuery<import('@/features/assignment/lib/dto').SubmissionDetail>({
    queryKey: ['instructor', 'submission', submissionId],
    queryFn: async () => {
      const response = await apiClient.get<import('@/features/assignment/lib/dto').SubmissionDetail>(
        `/instructor/submissions/${submissionId}`,
      );
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    {
      submissionId: string;
      request: import('@/features/assignment/lib/dto').GradeSubmissionRequest;
    }
  >({
    mutationFn: async ({ submissionId, request }) => {
      await apiClient.post(`/instructor/submissions/${submissionId}/grade`, request);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['instructor', 'submission', variables.submissionId],
      });
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['instructor', 'assignment'] });
    },
  });
};
