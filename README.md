# yj-blog

Next.js 16 기반 개인 블로그. App Router + Drizzle ORM + Neon PostgreSQL + Tailwind CSS v4 + shadcn/ui + Clerk 인증.

## 기술 스택

- **Framework**: Next.js 16 (App Router), React 19, TypeScript strict
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Auth**: Clerk (관리자 전용)
- **유효성 검사**: Zod (Server Action 입력 검증, 폼 스키마)
- **상태관리**: Zustand (클라이언트 전역 상태), TanStack Query (서버 상태 캐싱, 필요 시)
- **Storage**: Vercel Blob (이미지 업로드)
- **알림**: Resend (이메일), Discord Webhook (댓글 알림)
- **Deploy**: Vercel

## 환경 변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `DATABASE_URL` | Neon PostgreSQL 연결 문자열 | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 공개 키 | ✅ |
| `CLERK_SECRET_KEY` | Clerk 비밀 키 | ✅ |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 업로드 토큰 (Vercel 환경에서는 자동 주입) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | 사이트 URL (기본값: `https://yjlogs.com`) | - |
| `NEXT_PUBLIC_BASE_URL` | sitemap/robots 기준 URL | - |
| `RESEND_API_KEY` | Resend 이메일 전송 API 키 | - |
| `DISCORD_WEBHOOK_URL` | Discord 댓글 알림 Webhook URL | - |

## 브랜치 전략

| 브랜치 | 역할 |
|--------|------|
| `main` | 프로덕션 배포 브랜치 |
| `develop` | 통합 개발 브랜치. 기능 브랜치의 merge 대상 |
| `feature/*` | 기능 단위 개발 브랜치. 작업 완료 후 `develop`에 merge |

```
feature/xxx → develop → main
```

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
| `posts` | 블로그 글. slug 기반 URL, draft/published 상태, 조회수, 썸네일, SEO 메타(metaTitle, metaDescription), markdown/html 콘텐츠 |
| `categories` | 글 분류 (1:N). slug 기반 URL, 설명 필드 |
| `comments` | 비밀번호(bcrypt) 기반 댓글. parentId로 대댓글 지원, 소프트 삭제(isDeleted) |

**관계**: categories 1:N posts, posts 1:N comments, comments 셀프 참조(parentId → 대댓글)

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx                          # 루트 레이아웃 (ClerkProvider, Toaster)
│   │
│   ├── (main)/                             # 공개 페이지 그룹
│   │   ├── layout.tsx                      # Header, Footer
│   │   ├── page.tsx                        # 홈 (최신 글 목록)
│   │   ├── posts/
│   │   │   ├── page.tsx                    # 글 목록
│   │   │   └── [slug]/page.tsx             # 글 상세 + 댓글
│   │   └── categories/[slug]/page.tsx      # 카테고리별 글 목록
│   │
│   └── admin/                              # 관리자 페이지
│       ├── layout.tsx                      # Clerk auth 체크, AdminSidebar
│       ├── page.tsx                        # 대시보드
│       ├── posts/
│       │   ├── page.tsx                    # 글 관리 목록
│       │   └── new/page.tsx                # 글 작성 (layout.tsx 포함)
│       ├── categories/page.tsx             # 카테고리 관리
│       ├── comments/page.tsx               # 댓글 관리
│       ├── statistics/
│       │   ├── page.tsx                    # 통계
│       │   └── referrers/page.tsx          # 유입 경로
│       └── settings/page.tsx               # 설정
│
├── styles/
│   ├── prose.css                           # 글 상세 .prose 스타일
│   └── highlight.css                       # .hljs-* 토큰 색상 (github-dark 기반)
│
├── components/
│   ├── ui/                                 # shadcn/ui 자동 생성
│   ├── layout/                             # Header, Footer
│   └── post/                               # PostCard, PostList, PostListItem
│
├── hooks/                                  # 공통 커스텀 훅
│
├── db/
│   ├── index.ts                            # Drizzle + Neon 인스턴스
│   ├── schema.ts                           # 테이블 & 관계 정의
│   └── queries/                            # Server Component용 쿼리 함수
│
├── lib/
│   ├── utils.ts                            # cn() 유틸
│   ├── markdown.ts                         # remark/rehype 파이프라인
│   └── slugify.ts                          # 슬러그 변환
│
└── types/                                  # Zod 스키마 & 타입 정의

e2e/                                        # Playwright E2E 테스트
```

> 각 라우트 폴더에는 `_actions`, `_components`, `_hooks`, `_store.ts` 등 private 폴더/파일이 포함될 수 있다.

## 데이터 흐름

- **Server Component** → `db/queries/*.ts` 직접 호출 (DB 읽기)
- **Client Component** → `actions/*.ts` Server Actions 호출 (데이터 변경)
- **입력 검증** → Zod 스키마로 Server Action 진입 시 검증 (`types/` 폼 스키마 재사용)
- **전역 클라이언트 상태** → Zustand (UI 상태, 모달, 에디터 임시 데이터 등)
- **서버 상태 캐싱** → TanStack Query (필요 시 — 실시간 데이터, 낙관적 업데이트 등)
- **관리자 Actions** → 내부에서 Clerk `auth()` 재검증
- **댓글 Actions** → bcrypt로 비밀번호 검증 후 처리
- **캐시 무효화** → `revalidatePath()` / `revalidateTag()`

## 테스트 전략

### Vitest — 단위/통합 테스트
- 테스트 파일은 대상 파일 옆에 `*.test.ts(x)` 로 위치 (예: `PostCard.tsx` → `PostCard.test.tsx`)
- `types/` Zod 스키마 유효성 검증
- `components/` 컴포넌트 렌더링 및 인터랙션

### Playwright — E2E 테스트
- 실제 브라우저(Chromium)에서 사용자 시나리오 실행

```
e2e/                     # E2E 테스트
└── home.spec.ts
```
