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

/**
 * Submit Assignment Request Schema
 */
export const SubmitAssignmentRequestSchema = z.object({
  assignmentId: z.string().uuid(),
  textContent: z.string().min(1, '과제 내용을 입력해주세요'),
  link: z.string().url('올바른 URL 형식을 입력해주세요').optional().nullable(),
});

export type SubmitAssignmentRequest = z.infer<typeof SubmitAssignmentRequestSchema>;

/**
 * Submit Assignment Response Schema
 */
export const SubmitAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  status: z.enum(['submitted']),
  textContent: z.string(),
  link: z.string().nullable(),
  isLate: z.boolean(),
  submittedAt: z.string().datetime(),
});

export type SubmitAssignmentResponse = z.infer<typeof SubmitAssignmentResponseSchema>;

/**
 * Resubmit Assignment Request Schema
 */
export const ResubmitAssignmentRequestSchema = z.object({
  submissionId: z.string().uuid(),
  textContent: z.string().min(1, '과제 내용을 입력해주세요'),
  link: z.string().url('올바른 URL 형식을 입력해주세요').optional().nullable(),
});

export type ResubmitAssignmentRequest = z.infer<typeof ResubmitAssignmentRequestSchema>;

/**
 * Resubmit Assignment Response Schema
 */
export const ResubmitAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  status: z.enum(['submitted']),
  textContent: z.string(),
  link: z.string().nullable(),
  isLate: z.boolean(),
  submittedAt: z.string().datetime(),
});

export type ResubmitAssignmentResponse = z.infer<typeof ResubmitAssignmentResponseSchema>;

// ========================================
// Learner Assignment List Schemas
// ========================================

/**
 * Learner Assignment List Item Schema
 */
export const LearnerAssignmentListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  dueDate: z.string().datetime(),
  weight: z.number(),
  status: z.enum(['draft', 'published', 'closed']),
  allowLate: z.boolean(),
  isLate: z.boolean(),
  hasSubmitted: z.boolean(),
  submissionStatus: z.enum(['submitted', 'graded', 'resubmission_required']).nullable(),
  score: z.number().nullable(),
  createdAt: z.string().datetime(),
});

export type LearnerAssignmentListItem = z.infer<typeof LearnerAssignmentListItemSchema>;

/**
 * Learner Assignment List Response Schema
 */
export const LearnerAssignmentListResponseSchema = z.object({
  assignments: z.array(LearnerAssignmentListItemSchema),
  total: z.number().int(),
});

export type LearnerAssignmentListResponse = z.infer<typeof LearnerAssignmentListResponseSchema>;

// ========================================
// Instructor Mutation Schemas
// ========================================

/**
 * Create Assignment Request Schema (Instructor)
 */
export const CreateAssignmentRequestSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(200, '제목은 최대 200자까지 입력 가능합니다'),
  description: z.string().min(1, '설명을 입력하세요'),
  dueDate: z.string().datetime('유효한 날짜를 입력하세요'),
  weight: z.number().min(0, '점수 비중은 0 이상이어야 합니다').max(100, '점수 비중은 100 이하여야 합니다'),
  allowLate: z.boolean().default(false),
  allowResubmission: z.boolean().default(false),
});

export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestSchema>;

/**
 * Update Assignment Request Schema (Instructor)
 */
export const UpdateAssignmentRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  dueDate: z.string().datetime().optional(),
  weight: z.number().min(0).max(100).optional(),
  allowLate: z.boolean().optional(),
  allowResubmission: z.boolean().optional(),
});

export type UpdateAssignmentRequest = z.infer<typeof UpdateAssignmentRequestSchema>;

/**
 * Update Assignment Status Request Schema (Instructor)
 */
export const UpdateAssignmentStatusRequestSchema = z.object({
  status: z.enum(['draft', 'published', 'closed']),
});

export type UpdateAssignmentStatusRequest = z.infer<typeof UpdateAssignmentStatusRequestSchema>;

/**
 * Create Assignment Response Schema (Instructor)
 */
export const CreateAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['draft', 'published', 'closed']),
});

export type CreateAssignmentResponse = z.infer<typeof CreateAssignmentResponseSchema>;

/**
 * Assignment List Item Schema (Instructor)
 */
export const AssignmentListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  dueDate: z.string().datetime(),
  weight: z.number(),
  status: z.enum(['draft', 'published', 'closed']),
  submissionCount: z.number().int(),
  totalStudents: z.number().int(),
  createdAt: z.string().datetime(),
});

export type AssignmentListItem = z.infer<typeof AssignmentListItemSchema>;

/**
 * Assignment List Response Schema (Instructor)
 */
export const AssignmentListResponseSchema = z.object({
  assignments: z.array(AssignmentListItemSchema),
  total: z.number().int(),
});

export type AssignmentListResponse = z.infer<typeof AssignmentListResponseSchema>;

/**
 * Instructor Assignment Detail Schema
 */
export const InstructorAssignmentDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string().datetime(),
  weight: z.number(),
  allowLate: z.boolean(),
  allowResubmission: z.boolean(),
  status: z.enum(['draft', 'published', 'closed']),
  submissionCount: z.number().int(),
  totalStudents: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type InstructorAssignmentDetail = z.infer<typeof InstructorAssignmentDetailSchema>;

/**
 * Submission Filter Query Schema (Instructor)
 */
export const SubmissionFilterQuerySchema = z.object({
  filter: z.enum(['all', 'pending', 'late', 'resubmission']).default('all'),
});

export type SubmissionFilterQuery = z.infer<typeof SubmissionFilterQuerySchema>;

/**
 * Submission List Item Schema (Instructor)
 */
export const SubmissionListItemSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  learnerId: z.string().uuid(),
  learnerName: z.string(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  isLate: z.boolean(),
  submittedAt: z.string().datetime(),
  score: z.number().nullable(),
});

export type SubmissionListItem = z.infer<typeof SubmissionListItemSchema>;

/**
 * Submission List Response Schema (Instructor)
 */
export const SubmissionListResponseSchema = z.object({
  submissions: z.array(SubmissionListItemSchema),
  total: z.number().int(),
});

export type SubmissionListResponse = z.infer<typeof SubmissionListResponseSchema>;

/**
 * Submission Detail Schema (Instructor)
 */
export const SubmissionDetailSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  learnerId: z.string().uuid(),
  learnerName: z.string(),
  textContent: z.string(),
  link: z.string().nullable(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  isLate: z.boolean(),
  submittedAt: z.string().datetime(),
  gradedAt: z.string().datetime().nullable(),
  allowResubmission: z.boolean(),
});

export type SubmissionDetail = z.infer<typeof SubmissionDetailSchema>;

/**
 * Grade Submission Request Schema (Instructor)
 */
export const GradeSubmissionRequestSchema = z.object({
  score: z
    .number()
    .min(0, '점수는 0 이상이어야 합니다')
    .max(100, '점수는 100 이하여야 합니다'),
  feedback: z.string().min(1, '피드백을 입력하세요'),
  requestResubmission: z.boolean().default(false),
});

export type GradeSubmissionRequest = z.infer<typeof GradeSubmissionRequestSchema>;
