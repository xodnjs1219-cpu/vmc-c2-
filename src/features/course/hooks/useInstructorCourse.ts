'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  CreateCourseRequest,
  CreateCourseResponse,
  UpdateCourseRequest,
  UpdateCourseStatusRequest,
  Course,
} from '@/features/course/lib/dto';

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateCourseResponse, Error, CreateCourseRequest>({
    mutationFn: async (request: CreateCourseRequest) => {
      const response = await apiClient.post<CreateCourseResponse>(
        '/instructor/courses',
        request
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Course,
    Error,
    { courseId: string; request: UpdateCourseRequest }
  >({
    mutationFn: async ({ courseId, request }) => {
      const response = await apiClient.patch<Course>(
        `/instructor/courses/${courseId}`,
        request
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
    },
  });
};

export const useUpdateCourseStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Course,
    Error,
    { courseId: string; request: UpdateCourseStatusRequest }
  >({
    mutationFn: async ({ courseId, request }) => {
      const response = await apiClient.patch<Course>(
        `/instructor/courses/${courseId}/status`,
        request
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
    },
  });
};
