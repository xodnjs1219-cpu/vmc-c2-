'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  CreateReportRequest,
  ReportListResponse,
  UpdateReportRequest,
  CategoryItem,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DifficultyItem,
  CreateDifficultyRequest,
  UpdateDifficultyRequest,
  ReportStatus,
} from '@/features/operator/lib/dto';

// ========================================
// Report Hooks
// ========================================

export const useCreateReport = () => {
  return useMutation<{ id: string }, Error, CreateReportRequest>({
    mutationFn: async (request: CreateReportRequest) => {
      const response = await apiClient.post<{ id: string }>('/reports', request);
      return response.data;
    },
  });
};

export const useReports = (status?: ReportStatus) => {
  return useQuery<ReportListResponse>({
    queryKey: ['operator', 'reports', status],
    queryFn: async () => {
      const response = await apiClient.get<ReportListResponse>('/operator/reports', {
        params: status ? { status } : undefined,
      });
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { reportId: string; request: UpdateReportRequest }>({
    mutationFn: async ({ reportId, request }) => {
      await apiClient.patch(`/operator/reports/${reportId}`, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator', 'reports'] });
    },
  });
};

// ========================================
// Category Hooks
// ========================================

export const useCategories = () => {
  return useQuery<CategoryItem[]>({
    queryKey: ['operator', 'categories'],
    queryFn: async () => {
      const response = await apiClient.get<CategoryItem[]>('/operator/categories');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, CreateCategoryRequest>({
    mutationFn: async (request: CreateCategoryRequest) => {
      const response = await apiClient.post<{ id: string }>(
        '/operator/categories',
        request,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator', 'categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { categoryId: string; request: UpdateCategoryRequest }>({
    mutationFn: async ({ categoryId, request }) => {
      await apiClient.patch(`/operator/categories/${categoryId}`, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator', 'categories'] });
    },
  });
};

// ========================================
// Difficulty Hooks
// ========================================

export const useDifficulties = () => {
  return useQuery<DifficultyItem[]>({
    queryKey: ['operator', 'difficulties'],
    queryFn: async () => {
      const response = await apiClient.get<DifficultyItem[]>('/operator/difficulties');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateDifficulty = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, CreateDifficultyRequest>({
    mutationFn: async (request: CreateDifficultyRequest) => {
      const response = await apiClient.post<{ id: string }>(
        '/operator/difficulties',
        request,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator', 'difficulties'] });
    },
  });
};

export const useUpdateDifficulty = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { difficultyId: string; request: UpdateDifficultyRequest }>({
    mutationFn: async ({ difficultyId, request }) => {
      await apiClient.patch(`/operator/difficulties/${difficultyId}`, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator', 'difficulties'] });
    },
  });
};
