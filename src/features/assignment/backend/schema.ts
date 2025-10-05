import { z } from 'zod';

/**
 * Assignment Row Schema (Database Table Schema)
 */
export const AssignmentRowSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  due_date: z.string().datetime(),
  weight: z.number(),
  allow_late: z.boolean(),
  allow_resubmission: z.boolean(),
  status: z.enum(['draft', 'published', 'closed']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type AssignmentRow = z.infer<typeof AssignmentRowSchema>;

/**
 * Submission Row Schema (Database Table Schema)
 */
export const SubmissionRowSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  learner_id: z.string().uuid(),
  text_content: z.string(),
  link: z.string().nullable(),
  is_late: z.boolean(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  submitted_at: z.string().datetime(),
  graded_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type SubmissionRow = z.infer<typeof SubmissionRowSchema>;

/**
 * Submission Status Information
 */
export const SubmissionStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  textContent: z.string(),
  link: z.string().nullable(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  submittedAt: z.string().datetime(),
  gradedAt: z.string().datetime().nullable(),
  isLate: z.boolean(),
});

export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

/**
 * Assignment Detail Response Schema
 */
export const AssignmentDetailSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string().datetime(),
  weight: z.number(),
  allowLate: z.boolean(),
  allowResubmission: z.boolean(),
  status: z.enum(['draft', 'published', 'closed']),
  canSubmit: z.boolean(),
  isLate: z.boolean(),
  submitDisabledReason: z.string().optional(),
  submission: SubmissionStatusSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AssignmentDetail = z.infer<typeof AssignmentDetailSchema>;

/**
 * Assignment Detail Params Schema
 */
export const AssignmentDetailParamsSchema = z.object({
  courseId: z.string().uuid(),
  assignmentId: z.string().uuid(),
});

export type AssignmentDetailParams = z.infer<typeof AssignmentDetailParamsSchema>;
