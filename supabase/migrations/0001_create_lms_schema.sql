-- Migration: LMS (Learning Management System) schema
-- Creates all tables for course management, enrollment, assignments, and submissions

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Trigger Function
-- ============================================================================

-- Create trigger function for updating updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically updates updated_at timestamp on row update';

-- ============================================================================
-- 2. User & Profile Tables
-- ============================================================================

-- User profile and role information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('learner', 'instructor', 'operator')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profile and role information';
COMMENT ON COLUMN public.profiles.role IS 'User role: learner, instructor, or operator';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Terms and conditions version management
CREATE TABLE IF NOT EXISTS public.terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.terms IS 'Terms and conditions version management';

ALTER TABLE public.terms DISABLE ROW LEVEL SECURITY;

-- User terms agreement history
CREATE TABLE IF NOT EXISTS public.terms_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, term_id)
);

COMMENT ON TABLE public.terms_agreements IS 'User terms agreement history';

CREATE INDEX IF NOT EXISTS idx_terms_agreements_user ON public.terms_agreements(user_id);

ALTER TABLE public.terms_agreements DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Metadata Tables
-- ============================================================================

-- Course categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.categories IS 'Course categories';

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Difficulty levels
CREATE TABLE IF NOT EXISTS public.difficulties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.difficulties IS 'Difficulty levels';
COMMENT ON COLUMN public.difficulties.level IS 'Numeric level for sorting (1=beginner, 2=intermediate, 3=advanced, etc.)';

DROP TRIGGER IF EXISTS update_difficulties_updated_at ON public.difficulties;
CREATE TRIGGER update_difficulties_updated_at
  BEFORE UPDATE ON public.difficulties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.difficulties DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Course Tables
-- ============================================================================

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  difficulty_id UUID NOT NULL REFERENCES public.difficulties(id),
  curriculum TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.courses IS 'Courses created by instructors';
COMMENT ON COLUMN public.courses.curriculum IS 'Course curriculum (JSON or TEXT format)';
COMMENT ON COLUMN public.courses.status IS 'Course status: draft (editing), published (visible to learners), archived (no new enrollments)';

CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON public.courses(difficulty_id);

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Enrollment Tables
-- ============================================================================

-- Course enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(learner_id, course_id)
);

COMMENT ON TABLE public.enrollments IS 'Learner course enrollments';

CREATE INDEX IF NOT EXISTS idx_enrollments_learner ON public.enrollments(learner_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);

ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. Assignment Tables
-- ============================================================================

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  weight DECIMAL(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
  allow_late BOOLEAN NOT NULL DEFAULT false,
  allow_resubmission BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.assignments IS 'Course assignments';
COMMENT ON COLUMN public.assignments.weight IS 'Assignment weight percentage (0-100)';
COMMENT ON COLUMN public.assignments.allow_late IS 'Allow late submissions after due date';
COMMENT ON COLUMN public.assignments.allow_resubmission IS 'Allow resubmissions after grading';
COMMENT ON COLUMN public.assignments.status IS 'Assignment status: draft, published, closed';

CREATE INDEX IF NOT EXISTS idx_assignments_course ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);

DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. Submission Tables
-- ============================================================================

-- Assignment submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL,
  link TEXT,
  is_late BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmission_required')),
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, learner_id)
);

COMMENT ON TABLE public.submissions IS 'Assignment submissions by learners';
COMMENT ON COLUMN public.submissions.text_content IS 'Required text content of submission';
COMMENT ON COLUMN public.submissions.link IS 'Optional URL link';
COMMENT ON COLUMN public.submissions.is_late IS 'Whether submission was after due date';
COMMENT ON COLUMN public.submissions.status IS 'Submission status: submitted, graded, resubmission_required';
COMMENT ON COLUMN public.submissions.score IS 'Score (0-100)';

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_learner ON public.submissions(learner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_is_late ON public.submissions(is_late);

DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. Report Tables
-- ============================================================================

-- Reports (abuse, violations, etc.)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('course', 'assignment', 'submission', 'user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'investigating', 'resolved')),
  action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.reports IS 'User reports for abuse, policy violations, etc.';
COMMENT ON COLUMN public.reports.target_type IS 'Type of reported entity: course, assignment, submission, user';
COMMENT ON COLUMN public.reports.target_id IS 'ID of the reported entity';
COMMENT ON COLUMN public.reports.status IS 'Report status: received, investigating, resolved';
COMMENT ON COLUMN public.reports.action IS 'Action taken (warning, invalidation, restriction, etc.)';

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. Seed Data
-- ============================================================================

-- Insert default categories
INSERT INTO public.categories (name) VALUES
  ('프로그래밍'),
  ('디자인'),
  ('비즈니스'),
  ('마케팅'),
  ('데이터 과학')
ON CONFLICT (name) DO NOTHING;

-- Insert default difficulties
INSERT INTO public.difficulties (name, level) VALUES
  ('입문', 1),
  ('초급', 2),
  ('중급', 3),
  ('고급', 4),
  ('전문가', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert default terms
INSERT INTO public.terms (version, content, is_required) VALUES
  ('v1.0', '서비스 이용약관 내용입니다.', true),
  ('v1.0', '개인정보 처리방침 내용입니다.', true)
ON CONFLICT (version) DO NOTHING;
