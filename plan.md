# 글 작성 페이지 구현 계획

## Context
Tistory 스타일의 블로그 글 작성 페이지를 구현한다. 기본모드(WYSIWYG)와 마크다운 모드를 전환할 수 있으며, 풍부한 툴바 기능을 제공한다. 현재 프로젝트에는 글 작성/수정 관련 라우트, 서버 액션, 폼 컴포넌트가 전혀 없는 상태이다.

---

## 핵심 기술 선택

| 항목 | 선택 | 이유 |
|------|------|------|
| WYSIWYG 에디터 | **TipTap** (@tiptap/react) | ProseMirror 기반, headless(shadcn과 자유롭게 결합), 풍부한 확장 |
| 마크다운 에디터 | `<textarea>` + Geist Mono 폰트 | V1에 충분, CodeMirror는 나중에 추가 가능 |
| 상태 관리 | **Zustand** | 프로젝트 컨벤션(_store.ts) |
| 이미지 업로드 | **Vercel Blob** (@vercel/blob) | Next.js와 깔끔한 통합 |

## 스키마 변경

`posts` 테이블에 `contentFormat` 컬럼 추가:
```ts
// src/db/schema.ts
contentFormat: text('content_format').notNull().default('markdown'), // 'markdown' | 'html'
```
- WYSIWYG 모드 → `html` 저장, 마크다운 모드 → `markdown` 저장
- 글 상세 페이지에서 `contentFormat`에 따라 렌더링 분기

**수정 파일:**
- `src/db/schema.ts` — contentFormat 컬럼 추가
- `src/types/post.ts` — postFormSchema에 contentFormat 추가
- `src/app/posts/[slug]/_components/post-detail.tsx` — contentFormat 분기 렌더링

---

## 설치할 패키지

```bash
# TipTap 에디터
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-underline \
  @tiptap/extension-text-align @tiptap/extension-highlight @tiptap/extension-color \
  @tiptap/extension-text-style @tiptap/extension-link @tiptap/extension-image \
  @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell \
  @tiptap/extension-table-header @tiptap/extension-placeholder

# 상태 관리 & 이미지 업로드
npm install zustand @vercel/blob

# WYSIWYG→마크다운 변환 (모드 전환 시)
npm install turndown @types/turndown

# shadcn/ui 추가 컴포넌트
npx shadcn@latest add input textarea select dropdown-menu toggle toggle-group \
  tooltip popover dialog label
```

---

## 파일 구조

```
src/app/newpost/
├── layout.tsx                    # 전용 레이아웃 (Header/Footer 없는 전체화면)
├── page.tsx                      # Server Component - 인증, 카테고리 fetch
├── _store.ts                     # Zustand 스토어
├── _actions/
│   ├── save-post-action.ts       # 글 저장 (draft/published)
│   └── upload-image-action.ts    # 이미지 업로드 → URL 반환
└── _components/
    ├── newpost-page-client.tsx   # 'use client' 최상위 래퍼
    ├── title-input.tsx           # 제목 입력
    ├── editor-toolbar.tsx        # 서식 툴바 + 모드 드롭다운
    ├── wysiwyg-editor.tsx        # TipTap 에디터
    ├── markdown-editor.tsx       # 마크다운 textarea
    ├── category-selector.tsx     # 카테고리 드롭다운
    ├── bottom-bar.tsx            # 하단 바 (미리보기, 자동저장, 임시저장, 완료)
    ├── preview-dialog.tsx        # 미리보기 다이얼로그
    ├── link-dialog.tsx           # 링크 삽입 다이얼로그
    ├── image-upload-dialog.tsx   # 이미지 업로드 다이얼로그
    ├── table-insert-popover.tsx  # 테이블 삽입 팝오버
    ├── color-picker.tsx          # 텍스트/배경 색상 피커
    └── emoji-picker.tsx          # 이모지 피커
```

---

## 컴포넌트 구조

```
page.tsx (Server - auth guard, getCategories)
└── newpost-page-client.tsx (Client)
    ├── editor-toolbar.tsx
    │   ├── 모드 드롭다운 (기본모드/마크다운)
    │   ├── 제목 스타일 select (본문, 제목1~3)
    │   ├── 서식 버튼 (B, I, U, S, 색상, 하이라이트)
    │   ├── 정렬 토글 (좌/중/우/양쪽)
    │   ├── 인용, 목록, 표, 링크, 이미지, 이모지, 구분선
    │   └── 더보기(...)
    ├── category-selector.tsx
    ├── title-input.tsx
    ├── wysiwyg-editor.tsx (mode === 'wysiwyg')
    ├── markdown-editor.tsx (mode === 'markdown')
    └── bottom-bar.tsx
        ├── 미리보기 → preview-dialog.tsx
        ├── 자동 저장 표시
        ├── 임시저장 버튼
        └── 완료 버튼
```

---

## 레이아웃

`/newpost` 라우트는 Tistory처럼 **Header/Footer 없는 전체화면** 에디터:

```tsx
// src/app/newpost/layout.tsx
export default function NewPostLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex flex-col">{children}</div>
}
```

루트 layout.tsx의 Header/Footer를 건너뛰기 위해 **(newpost)** route group을 사용하거나, newpost/layout.tsx에서 자체 구조를 가짐. 루트 레이아웃이 항상 Header/Footer를 포함하므로, route group `(main)` 으로 기존 페이지를 묶고 `(newpost)` 그룹으로 분리하는 것이 깔끔함.

**구조 변경:**
```
src/app/
├── (main)/               # 기존 페이지들 이동
│   ├── layout.tsx        # Header + Footer 포함
│   ├── page.tsx
│   ├── posts/
│   └── categories/
├── (newpost)/            # 에디터 전용
│   └── newpost/
│       ├── layout.tsx    # Header/Footer 없음
│       └── page.tsx
└── layout.tsx            # 루트 (ClerkProvider, 폰트만)
```

---

## 인증

```tsx
// page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function NewPostPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const categories = await getCategories()
  return <NewPostPageClient categories={categories} />
}
```

---

## 서버 액션

### save-post-action.ts
- Clerk auth() 검증
- postFormSchema로 입력 검증
- postId 없으면 INSERT, 있으면 UPDATE
- status가 'published'이면 publishedAt 설정
- 반환: `{ success, postId }` 또는 `{ success: false, error }`

### upload-image-action.ts
- Clerk auth() 검증
- FormData에서 파일 추출
- @vercel/blob의 `put()`으로 업로드
- 반환: `{ url: string }`

---

## 모드 전환

- **기본모드 → 마크다운**: TipTap HTML을 `turndown`으로 마크다운 변환
- **마크다운 → 기본모드**: 마크다운을 HTML로 변환 후 TipTap `setContent(html)`
- 전환 시 확인 다이얼로그 표시 (서식 손실 경고)

---

## 자동 저장

- 제목/내용 변경 시 30초 디바운스로 draft 자동 저장
- 첫 저장에서 postId 생성, 이후 UPDATE
- 하단 바에 "자동 저장 완료 HH:MM:SS" 표시

---

## 구현 순서

### Phase 1: 기반 작업
1. route group으로 레이아웃 분리 (`(main)`, `(newpost)`)
2. 스키마에 `contentFormat` 추가 → `drizzle-kit push`
3. postFormSchema 업데이트
4. npm 패키지 설치 (TipTap, zustand, @vercel/blob, turndown)
5. shadcn/ui 컴포넌트 추가

### Phase 2: 기본 UI
6. `/newpost` page.tsx (auth guard + 카테고리 fetch)
7. `_store.ts` (Zustand 스토어)
8. `newpost-page-client.tsx` (클라이언트 래퍼)
9. `title-input.tsx`, `category-selector.tsx`
10. `bottom-bar.tsx`

### Phase 3: WYSIWYG 에디터
11. `wysiwyg-editor.tsx` (TipTap + 확장)
12. `editor-toolbar.tsx` (서식 버튼들)
13. `link-dialog.tsx`, `color-picker.tsx`, `table-insert-popover.tsx`, `emoji-picker.tsx`

### Phase 4: 마크다운 에디터 & 모드 전환
14. `markdown-editor.tsx`
15. 모드 전환 로직 (turndown 활용)

### Phase 5: 서버 액션 & 저장
16. `save-post-action.ts`, `upload-image-action.ts`
17. 임시저장/발행 연결
18. 자동 저장 구현
19. `image-upload-dialog.tsx`

### Phase 6: 미리보기 & 마무리
20. `preview-dialog.tsx`
21. 글 상세 페이지 contentFormat 분기 처리
22. slug 자동 생성 (제목 → kebab-case)
23. 스타일 정리 (Tistory 스타일 매칭)

---

## 검증 방법
1. `npm run build` — 빌드 에러 없음 확인
2. `npm run dev` → `/newpost` 접속, 로그인 안 된 상태에서 리다이렉트 확인
3. 기본모드에서 글 작성 → 서식 적용 확인 (Bold, 이탈릭, 표 등)
4. 마크다운 모드 전환 → 내용 변환 확인
5. 임시저장 → DB에 draft 상태로 저장 확인
6. 완료 → published 상태로 저장, `/posts/[slug]`에서 확인
7. 이미지 업로드 → 에디터에 삽입 확인
