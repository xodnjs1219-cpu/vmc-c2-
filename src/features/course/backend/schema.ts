import { z } from 'zod';

// ========================================
// DB Row Schemas
// ========================================

export const CategoryRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const DifficultyRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  level: z.number().int(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CourseRowSchema = z.object({
  id: z.string().uuid(),
  instructor_id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  category_id: z.string().uuid(),
  difficulty_id: z.string().uuid(),
  curriculum: z.string().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  created_at: z.string(),
  updated_at: z.string(),
});

// ========================================
// Query Schemas
// ========================================

export const CourseListQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  difficultyId: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  sortBy: z.enum(['latest', 'popular']).default('latest'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});

export const CourseDetailParamsSchema = z.object({
  id: z.string().uuid(),
});

// ========================================
// Response Schemas
// ========================================

export const CourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  curriculum: z.string().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  difficulty: z.object({
    id: z.string().uuid(),
    name: z.string(),
    level: z.number().int(),
  }),
  instructor: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  enrollmentCount: z.number().int(),
  isEnrolled: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CourseListResponseSchema = z.object({
  courses: z.array(CourseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const CourseDetailResponseSchema = CourseSchema;

// ========================================
// Instructor Mutation Schemas
// ========================================

export const CreateCourseRequestSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(200, '제목은 최대 200자까지 입력 가능합니다'),
  description: z.string().min(1, '소개를 입력하세요'),
  categoryId: z.string().uuid('유효한 카테고리를 선택하세요'),
  difficultyId: z.string().uuid('유효한 난이도를 선택하세요'),
  curriculum: z.string().optional(),
});

export const UpdateCourseRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  difficultyId: z.string().uuid().optional(),
  curriculum: z.string().optional(),
});

export const UpdateCourseStatusRequestSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
});

export const CreateCourseResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
});

// ========================================
// Type Exports
// ========================================

export type CategoryRow = z.infer<typeof CategoryRowSchema>;
export type DifficultyRow = z.infer<typeof DifficultyRowSchema>;
export type CourseRow = z.infer<typeof CourseRowSchema>;
export type CourseListQuery = z.infer<typeof CourseListQuerySchema>;
export type CourseDetailParams = z.infer<typeof CourseDetailParamsSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type CourseListResponse = z.infer<typeof CourseListResponseSchema>;
export type CourseDetailResponse = z.infer<typeof CourseDetailResponseSchema>;
export type CreateCourseRequest = z.infer<typeof CreateCourseRequestSchema>;
export type UpdateCourseRequest = z.infer<typeof UpdateCourseRequestSchema>;
export type UpdateCourseStatusRequest = z.infer<typeof UpdateCourseStatusRequestSchema>;
export type CreateCourseResponse = z.infer<typeof CreateCourseResponseSchema>;
