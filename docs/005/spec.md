# 과제 제출/재제출 (Learner) - Spec

## Primary Actor
- Learner (학습자)

## Precondition
- 사용자가 Learner 역할로 로그인되어 있음
- 사용자가 해당 코스에 수강 신청(`enrollment`)되어 있음
- 과제가 `published` 상태임
- 과제 상세 페이지에 접근한 상태

## Trigger
- 학습자가 과제 제출 폼에서 내용을 입력하고 "제출" 버튼을 클릭
- 또는 재제출이 필요한 과제에서 수정 후 "재제출" 버튼을 클릭

## Main Scenario

### 1. 최초 제출
1. 학습자가 과제 상세 페이지에서 제출 폼을 확인
2. Text 필드(필수)에 과제 내용 작성
3. Link 필드(선택)에 URL 입력 (선택적)
4. "제출" 버튼 클릭
5. 시스템이 입력 데이터 유효성 검증 수행
   - Text 필드 필수 입력 확인
   - Link 필드 입력 시 URL 형식 검증
6. 시스템이 제출 가능 여부 확인
   - 현재 시간과 마감일 비교
   - 과제 상태 확인 (`published` 또는 `closed`)
7. 마감일 전인 경우
   - `submissions` 테이블에 새 레코드 생성
   - `status = submitted`, `late = false` 설정
8. 마감일 후이고 지각 허용인 경우
   - `submissions` 테이블에 새 레코드 생성
   - `status = submitted`, `late = true` 설정
9. 제출 성공 메시지 표시
10. 과제 상세 페이지 상태 업데이트 (제출 완료 표시)

### 2. 재제출
1. 학습자가 채점 완료된 과제에서 "재제출 요청" 상태 확인
2. 기존 제출 내용을 수정 가능한 폼으로 확인
3. Text 및 Link 필드 수정
4. "재제출" 버튼 클릭
5. 시스템이 재제출 허용 여부 확인
   - 과제의 `allow_resubmission` 플래그 확인
   - 제출물 상태가 `resubmission_required`인지 확인
6. 재제출 가능한 경우
   - 기존 제출물의 `version` 증가
   - 새로운 제출 레코드 생성 또는 기존 레코드 업데이트
   - `status = submitted`, `resubmission_count` 증가
7. 재제출 성공 메시지 표시
8. 채점 대기 상태로 전환

## Edge Cases

### 1. 마감일 후 제출 시도 (지각 불허)
- **조건**: 마감일이 지났고 `allow_late_submission = false`
- **처리**: 제출 버튼 비활성화, "마감된 과제입니다" 메시지 표시
- **응답**: 제출 차단

### 2. URL 형식 오류
- **조건**: Link 필드에 잘못된 URL 형식 입력
- **처리**: 프론트엔드 유효성 검증 실패
- **응답**: "올바른 URL 형식을 입력해주세요" 에러 메시지

### 3. Text 필드 미입력
- **조건**: 필수 필드인 Text를 비워둔 채 제출
- **처리**: 프론트엔드 유효성 검증 실패
- **응답**: "과제 내용을 입력해주세요" 에러 메시지

### 4. 재제출 불가능한 과제에 재제출 시도
- **조건**: `allow_resubmission = false` 또는 상태가 `resubmission_required`가 아님
- **처리**: 재제출 버튼 비활성화 또는 숨김
- **응답**: "재제출이 허용되지 않는 과제입니다" 메시지

### 5. 수강하지 않은 코스의 과제 제출 시도
- **조건**: 해당 코스에 enrollment가 없음
- **처리**: 백엔드에서 권한 검증 실패
- **응답**: 403 Forbidden, "수강 중인 코스가 아닙니다"

### 6. 이미 제출한 과제에 중복 제출 시도 (재제출 아님)
- **조건**: `status = submitted` 또는 `graded` 상태에서 신규 제출 시도
- **처리**: 제출 버튼을 "재제출" 또는 비활성화 상태로 변경
- **응답**: "이미 제출한 과제입니다" 또는 재제출 안내

### 7. 네트워크 오류 또는 서버 에러
- **조건**: 제출 중 네트워크 오류 발생
- **처리**: 에러 핸들링, 재시도 안내
- **응답**: "제출에 실패했습니다. 다시 시도해주세요"

### 8. 과제가 `closed` 상태로 전환된 경우
- **조건**: 사용자가 폼 작성 중 과제가 마감됨
- **처리**: 제출 시점에 상태 재확인, 제출 차단
- **응답**: "과제가 마감되었습니다"

## Business Rules

### BR-1: 제출 필수 필드
- Text 필드는 필수 입력
- Link 필드는 선택 입력이지만, 입력 시 유효한 URL 형식이어야 함

### BR-2: 마감일 정책
- 마감일 전 제출: `late = false`
- 마감일 후 제출 시
  - `allow_late_submission = true`: 제출 가능, `late = true`
  - `allow_late_submission = false`: 제출 불가

### BR-3: 재제출 정책
- `allow_resubmission = true`이고 강사가 `resubmission_required` 상태로 변경한 경우에만 재제출 가능
- 재제출 시 `resubmission_count` 증가
- 재제출 횟수 제한은 현 버전에서 적용하지 않음 (향후 확장 가능)

### BR-4: 제출 상태 관리
- 최초 제출: `status = submitted`
- 채점 완료: `status = graded`
- 재제출 요청: `status = resubmission_required`
- 재제출 완료: 다시 `status = submitted`

### BR-5: 권한 검증
- 제출자는 반드시 해당 코스에 enrollment가 존재해야 함
- 과제는 `published` 상태여야 제출 가능 (`closed`는 지각 허용 시에만 가능)

### BR-6: 데이터 저장
- 모든 제출물은 `submissions` 테이블에 영구 저장
- 재제출의 경우 기존 레코드를 업데이트하거나 버전 관리 (구현 방식에 따라 결정)

### BR-7: 알림 및 피드백
- 제출 성공 시 즉각적인 피드백 제공
- 재제출 요청 시 학습자 대시보드에 알림 표시

---

## Sequence Diagram

\`\`\`plantuml
@startuml
actor User
participant FE
participant BE
database Database

== 최초 제출 ==
User -> FE: 과제 상세 페이지 접근
FE -> BE: GET /api/assignments/{id}
BE -> Database: SELECT assignment, enrollment
Database --> BE: assignment, enrollment data
BE --> FE: 과제 정보, 제출 권한 확인
FE --> User: 과제 내용 및 제출 폼 표시

User -> FE: Text 입력 (필수)
User -> FE: Link 입력 (선택)
User -> FE: "제출" 버튼 클릭
FE -> FE: 입력 유효성 검증 (Text 필수, URL 형식)

alt 유효성 검증 실패
    FE --> User: 에러 메시지 표시
else 유효성 검증 성공
    FE -> BE: POST /api/submissions\n{assignment_id, text, link}
    BE -> Database: SELECT assignment (마감일, 정책 확인)
    Database --> BE: assignment data
    
    alt 마감일 전
        BE -> Database: INSERT submission\n(status=submitted, late=false)
        Database --> BE: submission created
        BE --> FE: 201 Created, submission data
        FE --> User: "제출 완료" 메시지
        FE -> FE: 제출 상태 UI 업데이트
    else 마감일 후 + 지각 허용
        BE -> Database: INSERT submission\n(status=submitted, late=true)
        Database --> BE: submission created
        BE --> FE: 201 Created, submission data (late)
        FE --> User: "지각 제출 완료" 메시지
        FE -> FE: 제출 상태 UI 업데이트
    else 마감일 후 + 지각 불허
        BE --> FE: 403 Forbidden
        FE --> User: "마감된 과제입니다" 에러 메시지
    end
end

== 재제출 ==
User -> FE: 채점 완료 과제 확인
FE -> BE: GET /api/submissions/{id}
BE -> Database: SELECT submission
Database --> BE: submission (status=resubmission_required)
BE --> FE: submission data
FE --> User: 재제출 가능 상태 표시

User -> FE: Text/Link 수정
User -> FE: "재제출" 버튼 클릭
FE -> FE: 입력 유효성 검증

alt 유효성 검증 성공
    FE -> BE: PUT /api/submissions/{id}\n{text, link}
    BE -> Database: SELECT assignment (allow_resubmission 확인)
    Database --> BE: assignment data
    
    alt 재제출 허용
        BE -> Database: UPDATE submission\n(status=submitted, resubmission_count++, version++)
        Database --> BE: submission updated
        BE --> FE: 200 OK, updated submission
        FE --> User: "재제출 완료" 메시지
        FE -> FE: 채점 대기 상태로 UI 업데이트
    else 재제출 불허
        BE --> FE: 403 Forbidden
        FE --> User: "재제출이 허용되지 않습니다" 에러 메시지
    end
else 유효성 검증 실패
    FE --> User: 에러 메시지 표시
end

@enduml
\`\`\`
