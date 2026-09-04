# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고하는 가이드입니다.

> **상세 규칙**: 라우트 폴더 역할·코딩·컴포넌트·테스트 컨벤션은 `.claude/rules/`에 정의되어 있다 — `page-folder.md`(폴더 역할·네이밍), `coding-conventions.md`(코딩 규칙·CRUD 동사), `component.md`(컴포넌트 작성), `testing.md`(테스트).

## 커뮤니케이션 스타일
- 항상 한국어로 답변
- 경어 사용
- 간결하고 기술적인 톤 유지

## 명령어

저장소 루트에서 실행한다. 블로그 앱은 워크스페이스 이름 `web`이다.

```bash
pnpm dev --filter web    # 개발 서버 실행 (http://localhost:3000)
pnpm build               # 프로덕션 빌드 (모든 앱, Turborepo 캐시)
pnpm lint                # ESLint 실행 (모든 앱)
pnpm format              # Prettier 포맷팅 (저장소 전체)
```

### DB 스키마

스키마 변경 시 `drizzle-kit push`를 사용한다. 개인 프로젝트이므로 generate + migrate 대신 push로 직접 DB에 반영한다.

```bash
pnpm --filter web exec drizzle-kit push    # schema.ts 변경 후 DB에 바로 반영
pnpm --filter web exec drizzle-kit studio  # DB 데이터 GUI로 확인
```

> **주의**: 컬럼 삭제·타입 변경 등 데이터 손실 가능성이 있는 작업은 push 전에 반드시 확인한다.

### 테스트

```bash
pnpm --filter web test        # Vitest 단위/통합 테스트 (watch 모드)
pnpm test:run                 # Vitest 1회 실행 (CI용)
pnpm --filter web test:e2e    # Playwright E2E 테스트
```


## 브랜치 전략

- `main` — 프로덕션 배포 브랜치
- `develop` — 통합 개발 브랜치. 작업 브랜치의 merge 대상
- `feature/*` — **새 기능 추가** 전용 브랜치. 예: `feature/comment-report`
- `refactor/*` — 동작 변경 없이 구조·컨벤션을 정리하는 브랜치. 예: `refactor/posts-pure-component`
- `fix/*` — 버그 수정 브랜치. 예: `fix/comment-delete-error`

작업 완료 후 `develop`에 merge하고, merge된 브랜치는 제거한다.

흐름: `feature|refactor|fix/xxx` → `develop` → `main`

> 작업 시작 시 `develop`에서 성격에 맞는 접두사(`feature/`·`refactor/`·`fix/`)로 브랜치를 생성하고, 완료 후 `develop`으로 PR을 올린다.
>
> **예외**: `docs/superpowers/specs/`·`docs/superpowers/plans/`의 스펙·플랜 문서 작성 단계에서는 브랜치를 만들지 않는다. 문서는 `develop`에 직접 커밋한다. 브랜치는 실제 구현 코드를 작성하기 시작할 때 만든다.
>
> **문서 파일은 사용자 검토 전 커밋·푸시 금지**: 대상은 `docs/superpowers/specs/`·`docs/superpowers/plans/`의 스펙·플랜 문서, `CLAUDE.md`, `.claude/rules/*.md`다. 작성·수정 직후 바로 커밋하지 않는다. 사용자가 내용을 검토하고 승인한 뒤에만 커밋하고 푸시한다. 검토 중 수정이 계속 반영되므로, 커밋·푸시는 승인 시점 이후로 미룬다.
>
> 사용자가 이미 관련 작업을 지시했다는 사실만으로 승인을 추정하지 않는다 — "이 내용으로 반영해줘" · "커밋해줘" · "푸시해줘"처럼 **그 문서에 대한 명시적 승인**이 있어야 커밋·푸시한다. 이전에 다른 문서를 승인받았다는 사실은 이번 문서에 적용되지 않는다.

### 머지 규칙

- **squash 머지 금지**. 각 커밋 히스토리를 보존하기 위해 머지 커밋을 남기는 방식(`--no-ff`)으로 머지한다.
- feature 브랜치의 단계별 커밋을 develop에서도 그대로 추적할 수 있어야 한다.

## Git Worktree 규칙

- worktree에서 작업이 완료(PR 생성 또는 merge)된 후에는 반드시 해당 worktree를 제거한다.
- 제거 명령: `git worktree remove <worktree-경로>`
- worktree 제거 전 해당 디렉토리에 커밋되지 않은 변경사항이 없는지 확인한다.
- 강제 제거가 필요한 경우(미커밋 변경사항 있음): `git worktree remove --force <worktree-경로>`

## 저장소 구조

pnpm workspace + Turborepo 모노레포다. 앱은 `apps/` 아래에 있고 공유 패키지는 아직 없다.

- `apps/web/` — 블로그 (Next.js). 이 문서와 `.claude/rules/*.md`에 적힌 `src/`, `public/`, `e2e/` 경로는 모두 `apps/web/` 기준이다.
- `apps/portfolio/` — 포트폴리오 (Astro). 별도 스펙으로 추가한다.
- `docs/`, `.claude/`, `.github/` — 루트. 앱과 무관하게 저장소 전체를 다룬다.
- 루트 `package.json`은 워크스페이스 설정과 turbo 스크립트만 갖는다. 앱 의존성은 각 앱의 `package.json`에 둔다.

Vercel은 프로젝트별 Root Directory(`apps/web`, `apps/portfolio`)로 연결되어 있고, 무관한 커밋의 빌드는
Vercel 프로젝트 설정의 **Skip deployments**(Build and Deployment → Root Directory)가 건너뛴다. `vercel.json`의
`ignoreCommand`는 쓰지 않는다 — 대시보드의 Ignored Build Step 설정을 덮어쓰는 데다, `turbo-ignore`가 deprecated다.

## 아키텍처

Next.js 16 개인 블로그. **App Router** + React 19 + TypeScript strict 모드.

- `src/app/` — App Router 루트. `layout.tsx`는 루트 레이아웃, `page.tsx`는 홈페이지.
- `src/db/` — Drizzle ORM 설정. `schema.ts`에 모든 테이블 정의, `index.ts`에 db 인스턴스.
  - `src/db/cache-tags.ts` — `unstable_cache` / `revalidateTag`에 사용하는 태그 상수 (`CACHE_TAGS`). 태그 문자열은 반드시 이 파일에서 참조한다.
- `src/components/` — UI 컴포넌트. `ui/`는 shadcn/ui 자동 생성. 그 외 공통적으로 사용하는 컴포넌트.
- `src/db/queries/` — Server Component용 DB 쿼리 함수 모음/. 캐시가 필요한 함수는 `unstable_cache`로 감싸고 `CACHE_TAGS`로 태그를 지정한다.
- `public/` — 정적 파일.
- 이미지 업로드: **Cloudflare R2** (`@aws-sdk/client-s3`) 사용. Server Action은 `src/app/admin/posts/new/_components/_image-upload/_services/upload-image.ts`. 업로드 경로는 `images/{타임스탬프}-{파일명}`, 10MB 제한. 썸네일은 클라이언트에서 1MB 제한을 먼저 검사한다 (`thumbnail-upload-action.tsx`). 필요한 환경 변수: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
- 토스트 알림: **sonner** (`src/components/ui/sonner.tsx`). 루트 레이아웃에 `<Toaster />`를 등록하고, 이미지 업로드 에러(크기 초과, 서버 에러) 등 피드백이 필요한 곳에서 `toast.error()` / `toast.success()`를 사용한다.
- 스타일링: **Tailwind CSS v4** (PostCSS). 전역 스타일은 `app/globals.css`. 분리된 CSS는 `src/styles/`에 모아두고 `globals.css`에서 `@import`로 참조한다.
  - `src/styles/prose.css` — 글 상세 페이지 `.prose` 스타일
  - `src/styles/highlight.css` — highlight.js `.hljs-*` 토큰 색상 (github-dark 기반)
- 폰트: Geist Sans, Geist Mono (`next/font/google`). CSS 변수 `--font-geist-sans`, `--font-geist-mono`로 노출.
- 경로 별칭: `@/*` → `src/` (예: `@/components/...`, `@/db/...`).

새 라우트는 `src/app/` 하위에 폴더를 추가하는 App Router 컨벤션을 따른다 (예: `src/app/posts/[slug]/page.tsx`).
- `docs/` — 문서 루트. `superpowers/specs`(설계·스펙), `superpowers/plans`(구현 계획)에 날짜 prefix(`YYYY-MM-DD-`)로 보관하고, 날짜 없는 옛 문서는 `legacy/`에 둔다. 히스토리 문서는 수정하지 않는다.

## Plan 파일 실행 규칙

`docs/superpowers/plans/`의 plan 문서를 참조해 작업을 실행할 때는 아래 규칙을 따른다.

- **단계별 완료 표시**: 각 체크박스 항목(`- [ ]`)이 완료되면 즉시 해당 줄을 `- [x]`로 업데이트한다. 모아서 나중에 처리하지 않는다.
- **전체 완료 시 문서 업데이트**: 모든 항목이 완료되면 plan 문서 상단(또는 지정된 위치)에 완료 일자와 결과 요약을 추가한다.

## 커밋 규칙
:feat, :fix 이런 접미사보단 gitmoji를 적극 활용한다.