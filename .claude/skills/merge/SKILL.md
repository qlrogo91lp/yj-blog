---
name: merge
description: 현재 브랜치의 PR을 생성하고 머지한 뒤, 브랜치를 정리한다. develop 브랜치는 main으로 머지하며 브랜치를 삭제하지 않는다.
---

현재 브랜치의 작업을 PR로 올리고, 머지한 뒤, 브랜치를 정리하는 전 과정을 수행한다.

브랜치별 동작 차이:

| 브랜치 | base | 머지 방식 | 브랜치 삭제 |
|--------|------|-----------|-------------|
| `feature/*` | `develop` | squash | 로컬·리모트 모두 삭제 |
| `develop` | `main` | squash | 삭제 안 함 |

## 동작 순서

### 1. 현재 상태 파악

아래 명령을 병렬로 실행해 현재 상태를 파악한다:

```bash
git branch --show-current          # 현재 브랜치명 확인
git status                         # 미커밋 변경사항 확인
gh pr list --head $(git branch --show-current)  # PR 존재 여부 확인
```

- 미커밋 변경사항이 있으면 **작업을 중단**하고 사용자에게 알린다.
- 현재 브랜치가 `main`이면 **작업을 중단**하고 사용자에게 알린다.
- 현재 브랜치가 `develop`이면 → base: `main`, 머지 방식: `--merge`, 브랜치 삭제 없음.
- 그 외 브랜치이면 → base: `develop`, 머지 방식: `--squash`, 머지 후 브랜치 삭제.

### 2. 커밋 목록 확인

브랜치에 따라 비교 기준이 다르다:

- `develop` 브랜치: `git log main..HEAD --oneline`
- 그 외: `git log develop..HEAD --oneline`

### 3. PR 생성 (없을 경우)

PR이 이미 존재하면 이 단계를 건너뛴다.

PR 타이틀과 바디는 2단계의 커밋 목록을 기반으로 자동 구성한다.

```bash
gh pr create \
  --base <base브랜치> \
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

### 4. PR 머지

**feature/* 브랜치**: squash 머지, 리모트 브랜치 동시 삭제

```bash
gh pr merge --squash --delete-branch
```

**develop 브랜치**: squash 머지, 브랜치 삭제 없음

```bash
gh pr merge --squash
```

### 5. 로컬 브랜치 정리 (feature/* 브랜치만)

develop으로 전환 → pull → 로컬 브랜치 삭제 순서로 실행한다.

```bash
git checkout develop
git pull
git branch -d <브랜치명>
```

`-d`가 실패하면(완전히 머지되지 않은 것으로 판단될 경우) 사용자에게 확인 후 `-D`를 사용한다.

**develop 브랜치**: 브랜치 삭제 없이 pull만 실행한다.

```bash
git pull
```

### 6. 완료 검증

```bash
gh pr list                        # 열린 PR 없음 확인
git branch -a                     # 브랜치 상태 확인
git log <base브랜치> --oneline -3  # base 브랜치에 커밋 반영 확인
```

결과를 사용자에게 간략히 보고한다.

## 주의사항

- 리모트에 push되지 않은 브랜치는 `gh pr create` 전에 `git push -u origin <브랜치명>`을 먼저 실행한다.
- 각 단계 실패 시 즉시 중단하고 원인을 사용자에게 알린다. 강제로 진행하지 않는다.
