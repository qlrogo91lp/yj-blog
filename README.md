# yj-blog

Next.js 16 기반 개인 블로그. App Router + Drizzle ORM + Neon PostgreSQL + Tailwind CSS v4 + shadcn/ui + Clerk 인증.

## 기술 스택

- **Framework**: Next.js 16 (App Router), React 19, TypeScript strict
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Auth**: Clerk (관리자 전용)
- **유효성 검사**: Zod (Server Action 입력 검증, 폼 스키마)
- **상태관리**: Zustand (클라이언트 전역 상태), TanStack Query (서버 상태 캐싱, 필요 시)
- **Deploy**: Vercel

## 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint

# 테스트
npm run test        # Vitest 단위/통합 테스트 (watch 모드)
npm run test:run    # Vitest 1회 실행 (CI용)
npm run test:e2e    # Playwright E2E 테스트

# DB
npx drizzle-kit push    # schema.ts 변경 후 DB에 바로 반영
npx drizzle-kit studio  # DB 데이터 GUI로 확인
```

## DB 스키마

| 테이블 | 설명 |
|--------|------|
| `posts` | 블로그 글. slug 기반 URL, draft/published 상태, 조회수, SEO 메타 |
| `categories` | 글 분류 (1:N) |
| `comments` | 비밀번호 기반 댓글. parent_id로 대댓글 지원, 소프트 삭제 |

## 프로젝트 구조 (목표)

```
src/
├── app/
│   ├── layout.tsx                  # ClerkProvider, Header, Footer, Toaster
│   ├── page.tsx                    # 홈 (최신 글, 시리즈, 카테고리)
│   │
│   ├── posts/
│   │   ├── page.tsx                # 글 목록 (/posts?category=&page=)
│   │   └── [slug]/page.tsx         # 글 상세 + 댓글
│   │
│   ├── categories/[slug]/page.tsx  # 카테고리별 글 목록
│   │
│   ├── admin/
│   │   ├── layout.tsx              # Clerk auth 체크, AdminSidebar
│   │   ├── page.tsx                # 대시보드
│   │   ├── posts/
│   │   │   ├── page.tsx            # 글 관리 목록
│   │   │   ├── new/page.tsx        # 글 작성
│   │   │   └── [id]/edit/page.tsx  # 글 수정
│   │   └── categories/page.tsx     # 카테고리 관리
│   │
│   ├── sitemap.ts                  # 동적 sitemap.xml
│   ├── robots.ts                   # robots.txt (/admin/* disallow)
│   └── not-found.tsx
│
├── styles/
│   ├── prose.css                   # 글 상세 페이지 .prose 스타일 (rehype-stringify 출력)
│   └── highlight.css               # .hljs-* 토큰 색상 (github-dark 기반, rehype-highlight)
│
├── components/
│   ├── ui/                         # shadcn/ui 자동 생성
│   ├── layout/                     # Header, Footer, AdminSidebar
│   ├── post/                       # PostCard, PostList, PostContent, PostHeader, PostFooter, ViewCounter
│   ├── comment/                    # CommentList, CommentItem, CommentForm, CommentDeleteDialog
│   ├── category/                   # CategoryFilter, CategoryBadge
│   └── admin/                      # PostEditor, PostForm, CategoryForm
│
├── actions/                        # Server Actions
│   ├── post.ts                     # createPost, updatePost, deletePost, publishPost
│   ├── comment.ts                  # createComment, updateComment, deleteComment
│   ├── category.ts                 # createCategory, updateCategory, deleteCategory
│   └── view.ts                     # incrementViewCount
│
├── db/
│   ├── index.ts                    # Drizzle + Neon 인스턴스
│   ├── schema.ts                   # 테이블 & 관계 정의
│   └── queries/                    # Server Component용 재사용 쿼리 함수
│       ├── posts.ts
│       ├── comments.ts
│       └── categories.ts
│
├── lib/
│   ├── utils.ts                    # cn() 유틸
│   ├── markdown.ts                 # remark/rehype 파이프라인
│   ├── password.ts                 # bcryptjs 래퍼
│   └── metadata.ts                 # generateMetadata 헬퍼
│
└── types/
    ├── post.ts
    ├── comment.ts
    ├── category.ts
    └── index.ts

middleware.ts                       # Clerk - /admin/* 보호
```

## 데이터 흐름

- **Server Component** → `db/queries/*.ts` 직접 호출 (DB 읽기)
- **Client Component** → `actions/*.ts` Server Actions 호출 (데이터 변경)
- **입력 검증** → Zod 스키마로 Server Action 진입 시 검증 (`types/` 폼 스키마 재사용)
- **전역 클라이언트 상태** → Zustand (UI 상태, 모달, 에디터 임시 데이터 등)
- **서버 상태 캐싱** → TanStack Query (필요 시 — 실시간 데이터, 낙관적 업데이트 등)
- **관리자 Actions** → 내부에서 Clerk `auth()` 재검증
- **댓글 Actions** → bcrypt로 비밀번호 검증 후 처리
- **캐시 무효화** → `revalidatePath()` / `revalidateTag()`

## 구현 로드맵

### Phase 1 - 기반 구조
- `src/types/` — DB 스키마 기반 타입 정의
- `src/db/queries/` — 기본 쿼리 함수
- shadcn 컴포넌트 추가 (button, card, badge 등)
- Header, Footer 컴포넌트
- `src/app/layout.tsx` 업데이트
- Clerk 설치, `middleware.ts`

### Phase 2 - 공개 독자 페이지
- 홈페이지, 글 목록, 글 상세 (Markdown 렌더링)
- 카테고리 / 시리즈 목록 페이지
- sitemap.xml, robots.txt, 404 페이지

### Phase 3 - 댓글
- bcryptjs 기반 비밀번호 해싱
- 대댓글 트리 쿼리
- CommentList, CommentForm, CommentDeleteDialog

### Phase 4 - 조회수 + SEO
- ViewCounter (Client Component + Server Action)
- 각 페이지 `generateMetadata`

### Phase 5 - 관리자
- 글 / 카테고리 / 시리즈 CRUD 관리 페이지

## 테스트 전략

### Vitest — 단위/통합 테스트
- `lib/` 유틸 함수: markdown 파싱, 비밀번호 해싱, metadata 헬퍼 등
- `db/queries/` 쿼리 함수: DB를 mock 처리해 로직 검증
- `actions/` Server Actions: 입력 검증, 에러 처리 로직

```
src/
└── __tests__/           # 단위 테스트
    ├── lib/
    └── actions/
```

### Playwright — E2E 테스트
- 실제 브라우저(Chromium/Firefox/WebKit)에서 사용자 시나리오 실행
- 주요 테스트 케이스:
  - 홈 → 글 목록 → 글 상세 이동 흐름
  - 댓글 작성 → 비밀번호로 수정/삭제
  - 관리자 로그인 → 글 작성/수정/삭제

```
e2e/                     # E2E 테스트
├── home.spec.ts
├── post.spec.ts
├── comment.spec.ts
└── admin.spec.ts
```

## 설치 예정 패키지

```bash
npm install unified remark-parse remark-rehype rehype-stringify remark-gfm rehype-highlight rehype-slug
npm install bcryptjs && npm install -D @types/bcryptjs
npm install date-fns
npm install zod
npm install zustand
npm install @tanstack/react-query  # 필요 시

# 테스트
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test

npx shadcn@latest add button card input textarea badge dialog
npx shadcn@latest add dropdown-menu form label select separator table pagination sonner
```

> 에디터 패키지(Markdown 에디터)는 방식 결정 후 추가 예정.
