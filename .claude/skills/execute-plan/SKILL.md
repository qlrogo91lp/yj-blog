---
name: execute-plan
description: .claude/ 에 있는 plan.md 파일을 읽고 계획대로 코드를 수정한다. feature/* 브랜치에서 작업하며, 완료 후 plan 파일을 src/docs/로 이동한다.
---

`.claude/` 디렉터리에 있는 plan 파일을 읽고 계획대로 코드를 수정한다.

## 사용법

```
/execute-plan [plan파일명] [브랜치명]
```

- `plan파일명`: `.claude/` 디렉터리 기준 파일명 (예: `plan.md`, `cache-plan.md`). 생략하면 `plan.md`로 간주한다.
- `브랜치명`: 작업할 `feature/*` 브랜치명 (예: `feature/cache`). 생략하면 plan 파일 내용을 기반으로 자동 생성한다.

## 동작 순서

### 1. plan 파일 읽기

사용자가 지정한 파일(또는 기본값 `plan.md`)을 읽는다.

```bash
cat .claude/<plan파일명>
```

파일이 없으면 **즉시 중단**하고 사용자에게 알린다.

### 2. 브랜치 준비

아래 명령을 병렬로 실행해 현재 상태를 파악한다:

```bash
git branch --show-current   # 현재 브랜치 확인
git status                  # 미커밋 변경사항 확인
```

- 미커밋 변경사항이 있으면 **작업을 중단**하고 사용자에게 알린다.
- 브랜치명이 지정되지 않은 경우 plan 파일 제목·내용을 기반으로 `feature/<적절한-이름>` 형태로 자동 생성한다.
- `develop` 브랜치가 존재하면 `develop`에서, 없으면 `main`에서 브랜치를 생성한다.

```bash
git checkout develop        # 또는 main
git pull
git checkout -b feature/<브랜치명>
```

이미 해당 브랜치가 존재하면 checkout만 수행한다.

### 3. 계획 실행

plan 파일의 **체크리스트** 항목을 순서대로 실행한다.

- 각 항목을 완료할 때마다 사용자에게 진행 상황을 보고한다.
- 항목 실패 시 즉시 중단하고 원인을 사용자에게 알린다. 강제로 진행하지 않는다.
- 코드 수정은 CLAUDE.md 및 `.claude/rules/` 의 컨벤션을 준수한다.

### 4. 커밋

변경된 파일을 확인하고 커밋한다.

```bash
git status
git add <변경 파일들>
git commit -m "$(cat <<'EOF'
<커밋 메시지>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

커밋 메시지는 plan 파일의 제목과 변경 내용을 기반으로 간결하게 작성한다.

### 5. plan 파일을 src/docs/로 이동

작업이 완료되면 plan 파일을 `src/docs/`로 이동한다.

```bash
git mv .claude/<plan파일명> src/docs/<plan파일명>
git commit -m "$(cat <<'EOF'
📝 <plan파일명> → src/docs/ 이동

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### 6. 완료 보고

아래 정보를 사용자에게 요약 보고한다:

- 작업 브랜치명
- 완료된 체크리스트 항목 수
- 이동된 plan 파일 경로
- 다음 단계 안내 (`/merge` 로 PR 생성 가능)

## 주의사항

- plan 파일에 체크리스트(`- [ ]`)가 없으면 **## 수정 계획** 섹션의 항목을 순서대로 실행한다.
- 각 단계 실패 시 즉시 중단하고 원인을 사용자에게 알린다. 강제로 진행하지 않는다.
- `console.log`는 커밋하지 않는다.
- 브랜치가 리모트에 없으면 push 전 `git push -u origin <브랜치명>` 을 실행한다.
