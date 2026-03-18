# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 명령어

```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
npm run format   # Prettier 포맷팅 (전체 파일)

```

### DB 스키마

스키마 변경 시 `drizzle-kit push`를 사용한다. 개인 프로젝트이므로 generate + migrate 대신 push로 직접 DB에 반영한다.

```bash
npx drizzle-kit push    # schema.ts 변경 후 DB에 바로 반영
npx drizzle-kit studio  # DB 데이터 GUI로 확인
```

> **주의**: 컬럼 삭제·타입 변경 등 데이터 손실 가능성이 있는 작업은 push 전에 반드시 확인한다.

### 테스트

```bash
npm run test        # Vitest 단위/통합 테스트 (watch 모드)
npm run test:run    # Vitest 1회 실행 (CI용)
npm run test:e2e    # Playwright E2E 테스트
```


## 아키텍처

Next.js 16 개인 블로그. **App Router** + React 19 + TypeScript strict 모드.

- `src/app/` — App Router 루트. `layout.tsx`는 루트 레이아웃, `page.tsx`는 홈페이지.
- `src/db/` — Drizzle ORM 설정. `schema.ts`에 모든 테이블 정의, `index.ts`에 db 인스턴스.
- `src/components/` — UI 컴포넌트. `ui/`는 shadcn/ui 자동 생성. 그 외 공통적으로 사용하는 컴포넌트.
- `src/db/queries/` — Server Component용 DB 쿼리 함수 모음.
- `public/` — 정적 파일.
- 스타일링: **Tailwind CSS v4** (PostCSS). 전역 스타일은 `app/globals.css`. 분리된 CSS는 `src/styles/`에 모아두고 `globals.css`에서 `@import`로 참조한다.
  - `src/styles/prose.css` — 글 상세 페이지 `.prose` 스타일
  - `src/styles/highlight.css` — highlight.js `.hljs-*` 토큰 색상 (github-dark 기반)
- 폰트: Geist Sans, Geist Mono (`next/font/google`). CSS 변수 `--font-geist-sans`, `--font-geist-mono`로 노출.
- 경로 별칭: `@/*` → `src/` (예: `@/components/...`, `@/db/...`).

새 라우트는 `src/app/` 하위에 폴더를 추가하는 App Router 컨벤션을 따른다 (예: `src/app/posts/[slug]/page.tsx`).

