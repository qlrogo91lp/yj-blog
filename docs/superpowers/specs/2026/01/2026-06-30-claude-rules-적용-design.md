# claude rules 적용 리팩터링 — 설계

> 작성일: 2026-06-30
> 배경: 커밋 `a5b725d`에서 `.claude/rules/`(page-folder·coding-conventions·component)와 `CLAUDE.md`의 컨벤션을 개정했다. 이 문서는 **기존 코드베이스를 개정된 규칙에 맞게 정리**하기 위한 설계다.

## 목표

개정된 규칙과 현재 코드의 격차를 해소한다. 격차는 서로 독립적인 **4개 축**으로 나뉜다.

| 축 | 내용 | 대상 규모 | 위험도 |
|---|---|---|---|
| A. 컴포넌트 dot-suffix | `*-action.tsx` → `*.action.tsx` (handler·provider 동일) | 파일 ~23개 + import ~41줄 | 낮음 |
| D. 폴더 배치 정리 | `_components` 하위에 잘못 들어간 `_actions`를 상위로 이동 | 파일 2개 + 호출부 1 | 낮음 |
| B. Server Action 동사·접미사 | `_services` 함수에서 `-Action` 제거 + `add/get/edit/remove` 동사 | 파일 ~14개 + 호출부 13파일 | 중 |
| C. DB 쿼리 동사 | `get*`→`select*`, `create*`→`insert*` | 함수 20개 + 참조 21+파일 | 중상 |

## 진행 원칙

- **축별 feature 브랜치 / PR 분리.** 한 번에 밀어붙이지 않는다 (diff 비대화·빌드 깨짐 추적 곤란 방지).
- **순서**: A → D → B → C. 위험도·의존성이 낮고 기계적인 것부터, 참조가 가장 광범위한 C를 마지막에.
- 각 축은 독립 플랜 문서로 분리한다.
- **각 플랜 공통 검증**: 작업 후 `npm run build` + `npm run lint` 통과 확인 → `develop`으로 PR.
- 모든 rename은 **동작 변화 없는 순수 리네이밍**이다. 로직은 건드리지 않는다.

## 핵심 결정 사항 (회색지대)

`_services`(Server Action)와 `src/db/queries`(DB)는 **서로 다른 레이어**라 동사 세트가 다르다.
- DB 레이어 = SQL 한 문장 = `insert/select/update/delete`.
- Server Action 레이어 = 유스케이스(행위). 한 호출 안에서 여러 SQL + 비DB 작업을 수행할 수 있어 `add/get/edit/remove` 의도 동사를 쓴다.

이 때문에 단일 CRUD로 떨어지지 않는 함수가 존재하며, 다음과 같이 처리한다.

| 함수 | 실제 동작 | 처리 |
|---|---|---|
| `savePost` (service) | post upsert + 태그 교체 (다단계) | **의도 동사 유지** |
| `submitPost` (service) | savePost를 status 붙여 감쌈 | **의도 동사 유지** |
| `uploadImage` (service) | R2 스토리지 PutObject + DB insert (비CRUD) | **의도 동사 유지** |
| `softDeleteComment` (db) | `isDeleted=true` UPDATE (의미는 delete) | **이름 유지** (soft-delete 관례) |
| `createTag` (service) | find-or-create (select 후 insert) | `addTag`로 정리 (Create 유스케이스) |

> 검증 게이트: 위 표 중 `createTag → addTag`는 다단계 함수라 유지 후보로도 볼 수 있다. 플랜 리뷰 시 최종 확정한다.

## 플랜 문서

위치: `docs/superpowers/plans/`

- 플랜 1 (A): `2026-06-30-claude-rules-plan-1-component-dot-suffix.md`
- 플랜 2 (D): `2026-06-30-claude-rules-plan-2-folder-relocation.md`
- 플랜 3 (B): `2026-06-30-claude-rules-plan-3-server-action-verbs.md`
- 플랜 4 (C): `2026-06-30-claude-rules-plan-4-db-query-verbs.md`
