# Database Schema

## 개요

유저플로우에 명시된 최소 스펙의 PostgreSQL 데이터베이스 스키마

## ERD 개념도

```
Users (Supabase Auth 연동)
  ↓
  ├─ Profiles (역할, 프로필)
  ├─ TermsAgreements (약관 동의)
  └─ role 기반 분기
      ├─ Learner → Enrollments → Submissions
      └─ Instructor → Courses → Assignments
```

---

## 1. Users & Profiles

### 1.1 profiles
사용자 프로필 및 역할 정보

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('learner', 'instructor', 'operator')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
```

### 1.2 terms
약관 버전 관리

```sql
CREATE TABLE terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 1.3 terms_agreements
사용자별 약관 동의 이력

```sql
CREATE TABLE terms_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, term_id)
);

CREATE INDEX idx_terms_agreements_user ON terms_agreements(user_id);
```

---

## 2. Metadata

### 2.1 categories
코스 카테고리

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 difficulties
난이도 레벨

```sql
CREATE TABLE difficulties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Courses

### 3.1 courses
코스 정보

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  difficulty_id UUID NOT NULL REFERENCES difficulties(id),
  curriculum TEXT, -- JSON 또는 TEXT로 커리큘럼 저장
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_difficulty ON courses(difficulty_id);
```

---

## 4. Enrollments

### 4.1 enrollments
수강신청 정보

```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(learner_id, course_id)
);

CREATE INDEX idx_enrollments_learner ON enrollments(learner_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
```

---

## 5. Assignments

### 5.1 assignments
과제 정보

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  weight DECIMAL(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100), -- 점수 비중 (%)
  allow_late BOOLEAN NOT NULL DEFAULT false, -- 지각 허용 여부
  allow_resubmission BOOLEAN NOT NULL DEFAULT false, -- 재제출 허용 여부
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
```

---

## 6. Submissions

### 6.1 submissions
과제 제출물

```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL, -- 필수
  link TEXT, -- 선택 (URL 형식)
  is_late BOOLEAN NOT NULL DEFAULT false, -- 지각 여부
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmission_required')),
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100), -- 0~100
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, learner_id)
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_learner ON submissions(learner_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_is_late ON submissions(is_late);
```

---

## 7. Reports

### 7.1 reports
신고 정보

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('course', 'assignment', 'submission', 'user')),
  target_id UUID NOT NULL, -- 대상의 ID (polymorphic)
  reason TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'investigating', 'resolved')),
  action TEXT, -- 조치 내용 (경고, 무효화, 제한 등)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_status ON reports(status);
```

---

## 8. Triggers

### 8.1 updated_at 자동 갱신

```sql
-- 공통 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_difficulties_updated_at BEFORE UPDATE ON difficulties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 9. 주요 쿼리 패턴

### 9.1 Learner 대시보드 데이터

```sql
-- 내 코스 목록
SELECT c.*, e.enrolled_at
FROM courses c
JOIN enrollments e ON c.id = e.course_id
WHERE e.learner_id = :learner_id
  AND c.status = 'published';

-- 진행률 계산
WITH total_assignments AS (
  SELECT a.course_id, COUNT(*) AS total
  FROM assignments a
  WHERE a.status = 'published'
  GROUP BY a.course_id
),
completed_assignments AS (
  SELECT a.course_id, COUNT(*) AS completed
  FROM assignments a
  JOIN submissions s ON a.id = s.assignment_id
  WHERE s.learner_id = :learner_id
    AND s.status = 'graded'
  GROUP BY a.course_id
)
SELECT
  e.course_id,
  COALESCE(c.completed, 0) AS completed,
  COALESCE(t.total, 0) AS total,
  CASE
    WHEN COALESCE(t.total, 0) = 0 THEN 0
    ELSE ROUND(COALESCE(c.completed, 0)::DECIMAL / t.total * 100, 2)
  END AS progress_percentage
FROM enrollments e
LEFT JOIN total_assignments t ON e.course_id = t.course_id
LEFT JOIN completed_assignments c ON e.course_id = c.course_id
WHERE e.learner_id = :learner_id;

-- 마감 임박 과제
SELECT a.*
FROM assignments a
JOIN enrollments e ON a.course_id = e.course_id
LEFT JOIN submissions s ON a.id = s.assignment_id AND s.learner_id = :learner_id
WHERE e.learner_id = :learner_id
  AND a.status = 'published'
  AND s.id IS NULL -- 미제출
  AND a.due_date > NOW()
  AND a.due_date <= NOW() + INTERVAL '7 days'
ORDER BY a.due_date ASC;

-- 최근 피드백
SELECT s.*, a.title AS assignment_title
FROM submissions s
JOIN assignments a ON s.assignment_id = a.id
WHERE s.learner_id = :learner_id
  AND s.status = 'graded'
  AND s.feedback IS NOT NULL
ORDER BY s.graded_at DESC
LIMIT 5;
```

### 9.2 Instructor 대시보드 데이터

```sql
-- 내 코스 목록
SELECT c.*
FROM courses c
WHERE c.instructor_id = :instructor_id
ORDER BY c.created_at DESC;

-- 채점 대기 수
SELECT COUNT(*) AS pending_grading
FROM submissions s
JOIN assignments a ON s.assignment_id = a.id
JOIN courses c ON a.course_id = c.id
WHERE c.instructor_id = :instructor_id
  AND s.status = 'submitted';

-- 최근 제출물
SELECT s.*, a.title AS assignment_title, p.name AS learner_name
FROM submissions s
JOIN assignments a ON s.assignment_id = a.id
JOIN courses c ON a.course_id = c.id
JOIN profiles p ON s.learner_id = p.id
WHERE c.instructor_id = :instructor_id
ORDER BY s.submitted_at DESC
LIMIT 10;
```

### 9.3 과제 제출 검증

```sql
-- 제출 가능 여부 검증
SELECT
  a.*,
  CASE
    WHEN a.status != 'published' THEN 'assignment_not_published'
    WHEN a.due_date < NOW() AND a.allow_late = false THEN 'deadline_passed'
    WHEN EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.assignment_id = a.id
        AND s.learner_id = :learner_id
        AND s.status != 'resubmission_required'
    ) THEN 'already_submitted'
    ELSE 'can_submit'
  END AS submit_status,
  CASE
    WHEN a.due_date < NOW() THEN true
    ELSE false
  END AS is_late
FROM assignments a
WHERE a.id = :assignment_id;
```

### 9.4 코스 총점 계산

```sql
SELECT
  c.id AS course_id,
  c.title AS course_title,
  SUM(s.score * a.weight / 100) AS total_score
FROM courses c
JOIN assignments a ON c.id = a.course_id
JOIN submissions s ON a.id = s.assignment_id
WHERE s.learner_id = :learner_id
  AND s.status = 'graded'
  AND c.id = :course_id
GROUP BY c.id, c.title;
```

---

## 10. 데이터 무결성 규칙

### 10.1 비즈니스 룰

1. **수강신청**
   - 중복 수강 불가: UNIQUE(learner_id, course_id)
   - published 상태 코스만 신청 가능

2. **과제 제출**
   - 중복 제출 불가: UNIQUE(assignment_id, learner_id)
   - 마감일 후 제출: allow_late=true일 때만 가능, is_late=true로 표시
   - 재제출: allow_resubmission=true이고 status='resubmission_required'일 때만 가능

3. **채점**
   - 점수 범위: 0~100
   - 피드백 필수 (애플리케이션 레벨에서 검증)
   - 채점 완료 시 status='graded', graded_at 갱신

4. **상태 전환**
   - Course: draft → published → archived
   - Assignment: draft → published → closed
   - Submission: submitted → graded / resubmission_required

### 10.2 Cascade 정책

- **ON DELETE CASCADE**:
  - 사용자 삭제 시 관련 데이터 모두 삭제
  - 코스 삭제 시 과제/수강신청 모두 삭제
  - 과제 삭제 시 제출물 모두 삭제

---

## 11. 성능 최적화

### 11.1 인덱스 전략

- **복합 인덱스**: (learner_id, course_id), (assignment_id, learner_id)
- **상태 필터링**: status 컬럼에 인덱스
- **날짜 범위 쿼리**: due_date, created_at에 인덱스

### 11.2 쿼리 최적화

- JOIN 최소화
- 필요한 컬럼만 SELECT
- 페이지네이션 적용 (LIMIT/OFFSET)
- 집계 쿼리는 CTE 활용

---

## 12. 확장 고려사항

향후 추가 가능한 기능 (현재 스펙에는 미포함):

- **평점 시스템**: course_reviews 테이블
- **알림**: notifications 테이블
- **파일 업로드**: submission_files 테이블 (S3 연동)
- **토론**: discussions, discussion_comments 테이블
- **수료증**: certificates 테이블
- **결제**: payments 테이블
