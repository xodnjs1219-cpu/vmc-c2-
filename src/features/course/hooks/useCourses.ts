import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CourseListQuery, CourseListResponse } from '../lib/dto';

export const useCourses = (query?: CourseListQuery) => {
  return useQuery({
    queryKey: ['courses', query],
    queryFn: async () => {
      const response = await apiClient.get<CourseListResponse>('/courses', {
        params: query,
      });
      return response.data;
    },
  });
};
