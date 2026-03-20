---
name: merge
description: 현재 브랜치의 PR을 생성하고 머지한 뒤, 로컬·리모트 브랜치를 모두 삭제한다.
---

현재 브랜치의 작업을 PR로 올리고, 머지한 뒤, 로컬·리모트 브랜치를 정리하는 전 과정을 수행한다.

## 동작 순서

### 1. 현재 상태 파악

아래 명령을 병렬로 실행해 현재 상태를 파악한다:

```bash
git branch --show-current          # 현재 브랜치명 확인
git log main..HEAD --oneline       # main 대비 커밋 목록
git status                         # 미커밋 변경사항 확인
gh pr list --head $(git branch --show-current)  # PR 존재 여부 확인
```

- 미커밋 변경사항이 있으면 **작업을 중단**하고 사용자에게 알린다.
- 현재 브랜치가 `main`이면 **작업을 중단**하고 사용자에게 알린다.

### 2. PR 생성 (없을 경우)

PR이 이미 존재하면 이 단계를 건너뛴다.

PR 타이틀과 바디는 `git log main..HEAD --oneline` 결과를 기반으로 자동 구성한다.

```bash
gh pr create \
  --title "<타이틀>" \
  --body "$(cat <<'EOF'
## Summary
- <커밋 기반 변경 사항 요약>

## Test plan
- [ ] 빌드 확인
- [ ] 주요 기능 동작 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 3. PR 머지

squash 머지로 단일 커밋을 생성하고, 리모트 브랜치를 동시에 삭제한다.

```bash
gh pr merge --squash --delete-branch
```

> 머지 방식을 변경하고 싶다면 `--squash` 대신 `--merge` 또는 `--rebase`를 사용한다.

### 4. 로컬 브랜치 정리

main으로 전환 → pull → 로컬 브랜치 삭제 순서로 실행한다.

```bash
git checkout main
git pull
git branch -d <브랜치명>
```

`-d`가 실패하면(완전히 머지되지 않은 것으로 판단될 경우) 사용자에게 확인 후 `-D`를 사용한다.

### 5. 완료 검증

```bash
gh pr list                        # 열린 PR 없음 확인
git branch -a                     # 로컬·리모트 브랜치 삭제 확인
git log main --oneline -3         # main에 커밋 반영 확인
```

결과를 사용자에게 간략히 보고한다.

## 주의사항

- 리모트에 push되지 않은 브랜치는 `gh pr create` 전에 `git push -u origin <브랜치명>`을 먼저 실행한다.
- 각 단계 실패 시 즉시 중단하고 원인을 사용자에게 알린다. 강제로 진행하지 않는다.
