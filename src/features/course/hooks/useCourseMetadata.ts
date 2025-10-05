import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

type Category = {
  id: string;
  name: string;
};

type Difficulty = {
  id: string;
  name: string;
};

type CourseMetadataResponse = {
  categories: Category[];
  difficulties: Difficulty[];
};

export const useCourseMetadata = () => {
  return useQuery<CourseMetadataResponse>({
    queryKey: ['courses', 'metadata'],
    queryFn: async () => {
      const response = await apiClient.get('/courses/metadata');
      const data = response.data as any;
      
      // Handle nested response structure {ok: true, data: metadata}
      if (data && typeof data === 'object' && 'ok' in data && 'data' in data) {
        return data.data as CourseMetadataResponse;
      }
      
      return response.data as CourseMetadataResponse;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
