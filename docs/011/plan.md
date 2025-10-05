# 구현 계획: Assignment 게시/마감 (Instructor)

## 개요

이 기능은 **009 기능 (과제 관리)**의 상태 전환 기능에 포함되므로, 별도 구현 없이 009에서 통합 구현됩니다.

### Backend Modules

| 모듈 | 위치 | 설명 |
|------|------|------|
| **Assignment Status Service** | `src/features/assignment/backend/service.ts` | 009에서 이미 구현됨 (updateAssignmentStatus) |

### Frontend Modules

| 모듈 | 위치 | 설명 |
|------|------|------|
| **Assignment Status Toggle** | `src/features/assignment/components/assignment-status-toggle.tsx` | 009에서 이미 구현됨 |

---

## 추가 구현 사항

### 1. 자동 마감 로직 (선택적)

**파일**: `src/features/assignment/backend/service.ts`

**구현 내용**:
```typescript
// 과제 조회 시 자동 마감 체크
export async function checkAndAutoClose(client: SupabaseClient) {
  const now = new Date().toISOString();

  await client
    .from('assignments')
    .update({ status: 'closed' })
    .eq('status', 'published')
    .lt('due_date', now);
}
```

---

## QA Sheet

| 테스트 케이스 | 입력 | 예상 결과 | 실제 결과 | 상태 |
|--------------|------|----------|----------|------|
| draft → published 전환 | "게시하기" 클릭 | status='published' | | ⬜ |
| published → closed 전환 | "마감하기" 클릭 | status='closed' | | ⬜ |
| 자동 마감 | 마감일 이후 조회 | status='closed' | | ⬜ |

**예상 총 소요 시간**: 009에 포함 (추가 작업 1시간)
