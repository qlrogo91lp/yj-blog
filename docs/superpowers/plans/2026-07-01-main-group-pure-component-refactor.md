# (main) 그룹 — 순수 컴포넌트/구조 정리

> 브랜치: `refactor/main-group-pure-component` (from `develop`)
> 성격: 폴더 재배치 + fetch 위치 이동. 렌더링 결과·응답 데이터는 동일, 동작 변화 없음.
> 범위: `src/app/(main)` 전체에서 `posts/[slug]`(PR #50에서 이미 완료)를 제외한 나머지.
> 근거: `.claude/rules/page-folder.md`(`_components` 순수성), `component.md`

## 위반 목록

- [x] **`_components/hero-section.tsx`** — async 컴포넌트가 내부에서 `getBlogSettings()`(`@/db/queries/settings`)를 직접 호출해 DB 데이터를 페칭. props만 받는 순수 컴포넌트 규칙(page-folder.md) 위반.
  - 조치: `src/app/(main)/page.tsx`에서 `getBlogSettings()`를 호출해 필요한 필드(`name`/`headline`/`description` 등)를 props로 전달. `HeroSection`은 동기 순수 컴포넌트로 변경. (commit 24a376c)

- [x] **`_handlers/post-list-view.handler.tsx`** — `'use client'` 선언도 없고 `useState`/`useEffect` 등 클라이언트 훅도 전혀 없이 props(`posts`, `viewType`, `tagsMap`)만으로 렌더링. `_handlers`는 "사이드이펙트·조건부 렌더링만 하는 **클라이언트** 컴포넌트"가 정의인데 이 조건에 맞지 않음 — 사실상 순수 컴포넌트.
  - **결정(2026-07-01, 사용자 확인)**: 조치안 B 채택. 향후 조건부 렌더링/사이드이펙트 확장 계획이 있어 현재 위치를 유지하고, `.claude/rules/page-folder.md` `_handlers` 활용 패턴 절에 예외로 명시함. 코드 이동 없음.

- [x] **`posts/_actions/infinite-post-list.action.tsx`** — 무한스크롤 데이터를 `useState`/`useEffect`로 직접 `fetch('/api/posts?...')` 호출해 읽어옴. `page-folder.md`가 명시한 `_queries` 도입 트리거("무한 스크롤처럼 클라이언트에서 추가로 데이터를 읽는 경우가 늘어나면 도입한다")에 정확히 해당.
  - 조치: `posts/_queries/get-posts.ts`(fetch 함수 + 응답 타입, tanstack-query 미사용) + `posts/_queries/useInfinitePosts.ts`(위 함수를 감싸는 상태 훅) 신설. `infinite-post-list.action.tsx`는 훅을 사용해 렌더링만 담당. (commit 36900af, tanstack-query 미도입 결정은 사용자 확인)
  - 참고: 이 프로젝트에서 `_queries` 폴더의 첫 실사용 사례가 됨.

## 참고(이번 plan 범위 밖, 별도 판단 필요)

- DB 쿼리 계층의 `getCategories`/`getAllTags`/`getTagBySlug`/`getBlogSettings`(`src/db/queries/*`)가 `select*` 대신 `get*`을 그대로 사용 중. 2026-06-30 plan-4(DB 쿼리 동사 정리)가 12개 함수만 다루고 이 4개는 누락된 것으로 보임. 참조 범위가 `(main)` 밖(admin 등)까지 넓어 이번 plan에 포함하지 않음 — 필요 시 별도 plan으로 분리.
- `apps/_utils/apps-data.ts`, `apps/ralli/_utils/ralli-content.ts`가 순수 함수 외 정적 데이터 상수도 함께 export. 엄격히는 `_constants` 분리 대상이나 응집도가 높아 허용 가능 수준으로 판단, 액션 항목에서 제외.

## 절차

1. 위 체크박스 순서대로 `git mv` + export명/참조 갱신.
2. `npm run lint`, `npm run test:run`, `npm run build` 통과 확인.
3. `npm run dev`로 홈(`/`), `/posts` 무한스크롤 동작 회귀 확인.

## 검증

- [x] `npm run lint`
- [x] `npm run test:run`
- [x] `npm run build`
- [ ] 브라우저 회귀 확인: 홈 히어로 섹션 렌더링, `/posts` 무한스크롤 (A·B·C 3개 plan 전체 코드 작업 완료 후 한 번에 확인 예정)
