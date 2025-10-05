import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CourseDetailResponse } from '../lib/dto';

export const useCourse = (courseId: string) => {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: async () => {
      const response = await apiClient.get<CourseDetailResponse>(
        `/courses/${courseId}`
      );
      return response.data;
    },
    enabled: !!courseId,
  });
};
