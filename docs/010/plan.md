# 구현 계획: 제출물 채점 & 피드백 (Instructor)

## 개요

### Backend Modules

| 모듈 | 위치 | 설명 |
|------|------|------|
| **Grading Schema** | `src/features/assignment/backend/schema.ts` (확장) | 채점 요청/응답 스키마 추가 |
| **Grading Service** | `src/features/assignment/backend/service.ts` (확장) | 채점 비즈니스 로직 추가 |
| **Grading Route** | `src/features/assignment/backend/route.ts` (확장) | PATCH 라우터 추가 |

### Frontend Modules

| 모듈 | 위치 | 설명 |
|------|------|------|
| **Grading Page** | `src/app/(protected)/instructor/submissions/[id]/grade/page.tsx` | 채점 페이지 |
| **Grading Form Component** | `src/features/assignment/components/grading-form.tsx` | 채점 폼 컴포넌트 |
| **useGradeSubmission Hook** | `src/features/assignment/hooks/useGradeSubmission.ts` | 채점 mutation 훅 |
| **useSubmission Hook** | `src/features/assignment/hooks/useSubmission.ts` | 제출물 상세 조회 query 훅 |

---

## Implementation Plan

### 1. Backend: Grading Schema (확장)

```typescript
export const GradeSubmissionRequestSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(1, '피드백을 입력하세요'),
  requestResubmission: z.boolean().default(false),
});
```

### 2. Backend: Grading Service (확장)

주요 함수:
- `gradeSubmission`: 제출물 채점

### 3. Frontend: Grading Form Component

입력 필드:
- 점수 (0~100)
- 피드백 (텍스트 영역)
- 재제출 요청 (체크박스)

---

## QA Sheet

| 테스트 케이스 | 입력 | 예상 결과 | 실제 결과 | 상태 |
|--------------|------|----------|----------|------|
| 정상 채점 | 점수 85, 피드백 입력 | status='graded', 성공 메시지 | | ⬜ |
| 재제출 요청 | 재제출 체크박스 선택 | status='resubmission_required' | | ⬜ |
| 점수 범위 초과 | 점수 150 | "점수는 0~100 사이여야 합니다" 에러 | | ⬜ |
| 피드백 누락 | 피드백 빈 문자열 | "피드백을 입력하세요" 에러 | | ⬜ |
| 권한 없는 채점 시도 | 다른 강사의 제출물 ID | 403 에러 | | ⬜ |

**예상 총 소요 시간**: 4시간
