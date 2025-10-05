import { z } from 'zod';

// ========================================
// DB Row Schemas
// ========================================

export const EnrollmentRowSchema = z.object({
  id: z.string().uuid(),
  learner_id: z.string().uuid(),
  course_id: z.string().uuid(),
  enrolled_at: z.string(),
});

// ========================================
// Request Schemas
// ========================================

export const EnrollRequestSchema = z.object({
  courseId: z.string().uuid(),
});

export const UnenrollRequestSchema = z.object({
  courseId: z.string().uuid(),
});

// ========================================
// Response Schemas
// ========================================

export const EnrollResponseSchema = z.object({
  enrollmentId: z.string().uuid(),
  courseId: z.string().uuid(),
  enrolledAt: z.string(),
});

export const UnenrollResponseSchema = z.object({
  success: z.boolean(),
});

// ========================================
// Type Exports
// ========================================

export type EnrollmentRow = z.infer<typeof EnrollmentRowSchema>;
export type EnrollRequest = z.infer<typeof EnrollRequestSchema>;
export type UnenrollRequest = z.infer<typeof UnenrollRequestSchema>;
export type EnrollResponse = z.infer<typeof EnrollResponseSchema>;
export type UnenrollResponse = z.infer<typeof UnenrollResponseSchema>;
