import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '@/backend/http/result';
import { success, failure } from '@/backend/http/result';
import { enrollmentErrorCodes } from './error';
import type { EnrollResponse, UnenrollResponse } from './schema';

// ========================================
// enrollCourse - 수강신청
// ========================================

export async function enrollCourse(
  client: SupabaseClient,
  userId: string,
  courseId: string
): Promise<Result<EnrollResponse>> {
  try {
    // 1. Check if course exists and is published
    const { data: courseData, error: courseError } = await client
      .from('courses')
      .select('id, status')
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      return failure(enrollmentErrorCodes.courseNotFound, 'Course not found');
    }

    if (courseData.status !== 'published') {
      return failure(
        enrollmentErrorCodes.courseNotPublished,
        'Course is not available for enrollment'
      );
    }

    // 2. Check if already enrolled
    const { data: existingEnrollment } = await client
      .from('enrollments')
      .select('id')
      .eq('learner_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      return failure(
        enrollmentErrorCodes.alreadyEnrolled,
        'Already enrolled in this course'
      );
    }

    // 3. Create enrollment
    const { data: enrollmentData, error: enrollmentError } = await client
      .from('enrollments')
      .insert({
        learner_id: userId,
        course_id: courseId,
      })
      .select('id, course_id, enrolled_at')
      .single();

    if (enrollmentError || !enrollmentData) {
      return failure(
        enrollmentErrorCodes.enrollmentFailed,
        enrollmentError?.message || 'Failed to enroll in course'
      );
    }

    return success({
      enrollmentId: enrollmentData.id,
      courseId: enrollmentData.course_id,
      enrolledAt: enrollmentData.enrolled_at,
    });
  } catch (error) {
    return failure(
      enrollmentErrorCodes.enrollmentFailed,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ========================================
// unenrollCourse - 수강취소
// ========================================

export async function unenrollCourse(
  client: SupabaseClient,
  userId: string,
  courseId: string
): Promise<Result<UnenrollResponse>> {
  try {
    // 1. Check if enrollment exists
    const { data: enrollmentData, error: fetchError } = await client
      .from('enrollments')
      .select('id')
      .eq('learner_id', userId)
      .eq('course_id', courseId)
      .single();

    if (fetchError || !enrollmentData) {
      return failure(enrollmentErrorCodes.notEnrolled, 'Not enrolled in this course');
    }

    // 2. Delete enrollment
    const { error: deleteError } = await client
      .from('enrollments')
      .delete()
      .eq('id', enrollmentData.id);

    if (deleteError) {
      return failure(
        enrollmentErrorCodes.unenrollmentFailed,
        deleteError.message || 'Failed to unenroll from course'
      );
    }

    return success({ success: true });
  } catch (error) {
    return failure(
      enrollmentErrorCodes.unenrollmentFailed,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
