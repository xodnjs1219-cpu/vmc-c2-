import { z } from 'zod';

/**
 * Submission Grade Schema
 */
export const SubmissionGradeSchema = z.object({
  submissionId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  assignmentWeight: z.number(),
  assignmentDueDate: z.string().datetime(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  isLate: z.boolean(),
  submittedAt: z.string().datetime(),
  gradedAt: z.string().datetime().nullable(),
});

export type SubmissionGrade = z.infer<typeof SubmissionGradeSchema>;

/**
 * Course Grade Schema
 */
export const CourseGradeSchema = z.object({
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  totalScore: z.number(),
  submissions: z.array(SubmissionGradeSchema),
});

export type CourseGrade = z.infer<typeof CourseGradeSchema>;

/**
 * Grades Response Schema
 */
export const GradesResponseSchema = z.object({
  courses: z.array(CourseGradeSchema),
});

export type GradesResponse = z.infer<typeof GradesResponseSchema>;
