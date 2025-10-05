import { z } from 'zod';

// ========== Learner Dashboard Schemas ==========

// Progress info
export const CourseProgressSchema = z.object({
  completed: z.number().int().min(0),
  total: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
});

export type CourseProgress = z.infer<typeof CourseProgressSchema>;

// My course with progress
export const DashboardCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  difficulty: z.string(),
  enrolledAt: z.string(),
  progress: CourseProgressSchema,
});

export type DashboardCourse = z.infer<typeof DashboardCourseSchema>;

// Upcoming assignment
export const UpcomingAssignmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  dueDate: z.string(),
  daysRemaining: z.number().int(),
});

export type UpcomingAssignment = z.infer<typeof UpcomingAssignmentSchema>;

// Recent feedback
export const RecentFeedbackSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  gradedAt: z.string(),
});

export type RecentFeedback = z.infer<typeof RecentFeedbackSchema>;

// Learner Dashboard response
export const DashboardResponseSchema = z.object({
  courses: z.array(DashboardCourseSchema),
  upcomingAssignments: z.array(UpcomingAssignmentSchema),
  recentFeedback: z.array(RecentFeedbackSchema),
});

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

// ========== Instructor Dashboard Schemas ==========

// Course info for instructor
export const InstructorCourseInfoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string(),
  enrollmentCount: z.number().int().min(0),
  assignmentCount: z.number().int().min(0),
  pendingGradingCount: z.number().int().min(0),
});

export type InstructorCourseInfo = z.infer<typeof InstructorCourseInfoSchema>;

// Recent submission info
export const InstructorRecentSubmissionSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  learnerName: z.string(),
  submittedAt: z.string(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
});

export type InstructorRecentSubmission = z.infer<
  typeof InstructorRecentSubmissionSchema
>;

// Instructor Dashboard response
export const InstructorDashboardResponseSchema = z.object({
  courses: z.array(InstructorCourseInfoSchema),
  recentSubmissions: z.array(InstructorRecentSubmissionSchema),
  totalPendingGrading: z.number().int().min(0),
});

export type InstructorDashboardResponse = z.infer<
  typeof InstructorDashboardResponseSchema
>;
