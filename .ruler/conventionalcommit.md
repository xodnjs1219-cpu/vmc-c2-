---
description: Conventional Commits 명세 (v1.0.0-beta.4)
globs:
  - "**/*"
---

# Conventional Commits

Conventional Commits는 커밋 메시지에 대한 가벼운 컨벤션 규칙으로, 명확한 커밋 히스토리를 생성하고 자동화된 도구 개발을 용이하게 합니다.

## MUST

- **사용자가 커밋을 요청할 때 반드시 이 문서의 Conventional Commits 형식을 따라야 합니다**
- 모든 커밋 메시지는 `<타입>[적용 범위(선택 사항)]: <설명>` 구조를 준수해야 합니다
- 커밋 메시지 작성 전에 반드시 변경사항을 분석하여 적절한 타입을 선택해야 합니다
- **커밋 메시지의 <설명> 부분은 반드시 한국어로 작성해야 합니다**
- 본문(body)과 꼬리말(footer)도 한국어로 작성합니다
- Co-Authored-By 태그는 유지하되, Conventional Commits 형식과 함께 사용합니다

## 커밋 시점 자동 추천

Claude Code는 다음 상황에서 **자동으로 커밋을 제안**해야 합니다:

### 1. 논리적 작업 단위 완료 시
- 새로운 기능이 완전히 구현되었을 때
- 버그 수정이 완료되고 검증되었을 때
- 리팩토링 작업이 마무리되었을 때
- 문서 작성/수정이 완료되었을 때

### 2. 파일 변경 임계값 도달 시
- 3개 이상의 파일이 수정되었을 때
- 100줄 이상의 코드 변경이 발생했을 때
- 새로운 디렉토리나 주요 파일이 생성되었을 때

### 3. 중요한 마일스톤 달성 시
- 스키마 설계 완료
- API 엔드포인트 구현 완료
- UI 컴포넌트 완성
- 테스트 작성 완료
- 빌드/배포 설정 완료

### 4. 작업 전환 전
- 다른 기능으로 작업을 전환하기 전
- 사용자가 새로운 요청을 하기 전
- 세션 종료 전

### 커밋 제안 방법

Claude Code는 위 조건에 해당할 때 다음과 같이 제안해야 합니다:

```
[작업 완료 후]
작업이 완료되었습니다. 현재 변경사항을 커밋하시겠습니까?

변경된 파일:
- src/features/auth/schema.ts (신규)
- src/features/auth/route.ts (수정)
- docs/api.md (수정)

제안하는 커밋 메시지:
feat(auth): 사용자 인증 API 엔드포인트 구현
```

### 커밋하지 않아야 하는 경우

- 작업이 중간 단계이고 불완전할 때
- 빌드/테스트 오류가 있을 때
- 임시 파일이나 디버깅 코드가 포함되어 있을 때
- 사용자가 명시적으로 "커밋하지 마" 라고 지시했을 때

## 커밋 메시지 구조

```
<타입>[적용 범위(선택 사항)]: <설명>

[본문(선택 사항)]

[꼬리말(선택 사항)]
```

## 주요 타입

### 필수 타입

- **fix**: 버그 패치 (PATCH 버전과 연관)
- **feat**: 새로운 기능 추가 (MINOR 버전과 연관)
- **BREAKING CHANGE**: 주요 API 변경 (MAJOR 버전과 연관)
  - 꼬리말에 `BREAKING CHANGE:` 로 표시하거나
  - 타입/적용범위 뒤에 `!` 추가 (예: `feat!:`, `fix(scope)!:`)

### 권장 타입

- **build**: 빌드 시스템 또는 외부 종속성 변경
- **chore**: 기타 변경사항 (프로덕션 코드 변경 없음)
- **ci**: CI 구성 파일 및 스크립트 변경
- **docs**: 문서 변경
- **style**: 코드 포맷팅, 세미콜론 누락 등 (코드 동작 변경 없음)
- **refactor**: 버그 수정이나 기능 추가가 아닌 코드 변경
- **perf**: 성능 개선
- **test**: 테스트 추가 또는 수정

## 명세 규칙

1. 커밋은 반드시 타입으로 시작해야 하며, 명사로 구성됩니다 (feat, fix 등)
2. 타입 뒤에 선택적으로 적용 범위를 괄호로 표시할 수 있습니다
3. 타입 (그리고 적용 범위) 뒤에는 콜론과 공백이 와야 합니다
4. 설명은 타입/적용범위 접두어 바로 뒤에 작성합니다
5. 본문은 설명 다음 빈 줄 후에 작성할 수 있습니다
6. 본문은 자유 형식이며 여러 단락으로 구성될 수 있습니다
7. 꼬리말은 본문 다음 빈 줄 후에 작성할 수 있습니다
8. 주요 변경사항(Breaking changes)은 반드시 명시되어야 합니다
9. `BREAKING CHANGE:`는 대문자로 작성되어야 합니다
10. `BREAKING CHANGE:` 뒤에는 설명이 와야 합니다
11. feat, fix 외의 타입도 사용할 수 있습니다
12. 꼬리말은 `<토큰>: <값>` 형식이어야 합니다 (BREAKING CHANGE 제외)

## 예시

### 설명과 주요 변경사항이 있는 커밋

```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

### `!`를 사용한 주요 변경사항 표시

```
feat!: send an email to the customer when a product is shipped
```

### 적용 범위와 `!`를 사용한 주요 변경사항

```
feat(api)!: send an email to the customer when a product is shipped
```

### `!`와 BREAKING CHANGE 꼬리말을 모두 사용

```
chore!: drop support for Node 6

BREAKING CHANGE: use JavaScript features not available in Node 6.
```

### 본문이 없는 커밋

```
docs: correct spelling of CHANGELOG
```

### 적용 범위가 있는 커밋

```
feat(lang): add Korean language
```

### 다단락 본문과 여러 꼬리말이 있는 커밋

```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```

## 장점

1. **자동화된 CHANGELOG 생성**
2. **명확한 커밋 히스토리** - 유의적 버전 범프 자동 결정
3. **구조화된 커밋 메시지** - 팀원, 대중, 기타 이해관계자들이 이해하기 쉬움
4. **CI/CD 트리거 용이성** - 구조화된 커밋 히스토리로 자동화된 프로세스 실행
5. **프로젝트 기여 장벽 완화** - 더 구조화된 커밋 히스토리 탐색 가능

## FAQ

### 초기 개발 단계에서는 어떻게 해야 하나요?
- 0.y.z 버전을 사용하거나, 초기 개발 브랜치에서 작업하세요.

### Breaking Change는 언제 MAJOR 버전을 올려야 하나요?
- 0.y.z에서는 언제든 변경 가능하지만, 안정적 1.0.0 이후에는 MAJOR 버전을 올려야 합니다.

### 실수로 잘못된 타입을 사용했다면?
- 명세를 따르기 전: 자유롭게 수정
- 명세를 따른 후: `git revert`로 되돌리고 올바른 타입으로 새 커밋 작성

### 모든 기여자가 Conventional Commits를 사용해야 하나요?
- 아니요. squash 기반 Git 워크플로우를 사용하면 유지관리자가 병합 시 정리 가능합니다.

### 어떤 도구를 사용할 수 있나요?
- commitizen/cz-cli
- commitlint
- conventional-changelog
- standard-version / semantic-release

## 프로젝트 적용 가이드라인

- 모든 커밋 메시지는 Conventional Commits 형식을 따라야 합니다
- PR 병합 시 squash merge를 사용하고, 최종 커밋 메시지를 Conventional Commits 형식으로 작성합니다
- CI/CD에서 commitlint를 사용하여 커밋 메시지 형식을 자동으로 검증합니다
- CHANGELOG는 자동 생성 도구(conventional-changelog)를 사용합니다

## 참고 자료

- 공식 사이트: https://www.conventionalcommits.org/ko/v1.0.0-beta.4/
- 관련 명세: [Semantic Versioning](https://semver.org/)
