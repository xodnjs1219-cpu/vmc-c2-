import { z } from 'zod';

// ========================================
// Report Schemas
// ========================================

export const ReportTargetTypeSchema = z.enum(['course', 'assignment', 'submission', 'user']);

export type ReportTargetType = z.infer<typeof ReportTargetTypeSchema>;

export const ReportStatusSchema = z.enum(['received', 'investigating', 'resolved']);

export type ReportStatus = z.infer<typeof ReportStatusSchema>;

/**
 * Create Report Request Schema
 */
export const CreateReportRequestSchema = z.object({
  targetType: ReportTargetTypeSchema,
  targetId: z.string().uuid(),
  reason: z.string().min(1, '사유를 입력하세요'),
  content: z.string().min(1, '내용을 입력하세요'),
});

export type CreateReportRequest = z.infer<typeof CreateReportRequestSchema>;

/**
 * Report Item Schema
 */
export const ReportItemSchema = z.object({
  id: z.string().uuid(),
  reporterId: z.string().uuid(),
  reporterName: z.string(),
  targetType: ReportTargetTypeSchema,
  targetId: z.string().uuid(),
  reason: z.string(),
  content: z.string(),
  status: ReportStatusSchema,
  actionTaken: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ReportItem = z.infer<typeof ReportItemSchema>;

/**
 * Report List Response Schema
 */
export const ReportListResponseSchema = z.object({
  reports: z.array(ReportItemSchema),
  total: z.number().int(),
});

export type ReportListResponse = z.infer<typeof ReportListResponseSchema>;

/**
 * Update Report Request Schema (Operator)
 */
export const UpdateReportRequestSchema = z.object({
  status: ReportStatusSchema,
  actionTaken: z.string().optional(),
});

export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;

// ========================================
// Category Schemas
// ========================================

/**
 * Category Item Schema
 */
export const CategoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CategoryItem = z.infer<typeof CategoryItemSchema>;

/**
 * Create Category Request Schema
 */
export const CreateCategoryRequestSchema = z.object({
  name: z.string().min(1, '카테고리 이름을 입력하세요').max(50, '이름은 최대 50자까지 입력 가능합니다'),
});

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;

/**
 * Update Category Request Schema
 */
export const UpdateCategoryRequestSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;

// ========================================
// Difficulty Schemas
// ========================================

/**
 * Difficulty Item Schema
 */
export const DifficultyItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  level: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DifficultyItem = z.infer<typeof DifficultyItemSchema>;

/**
 * Create Difficulty Request Schema
 */
export const CreateDifficultyRequestSchema = z.object({
  name: z.string().min(1, '난이도 이름을 입력하세요').max(50, '이름은 최대 50자까지 입력 가능합니다'),
  level: z.number().int().min(1, '레벨은 1 이상이어야 합니다'),
});

export type CreateDifficultyRequest = z.infer<typeof CreateDifficultyRequestSchema>;

/**
 * Update Difficulty Request Schema
 */
export const UpdateDifficultyRequestSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  level: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDifficultyRequest = z.infer<typeof UpdateDifficultyRequestSchema>;
