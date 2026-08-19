# UI 리프레시 설계 — Header · 포스트 상단 · 댓글

작성일: 2026-06-29

## 배경

참조 디자인(rounded pill nav, 포스트 상단 히어로, 댓글 컨셉)을 차용해 세 영역의 UI를 개선한다.

- **색상은 참조하지 않는다.** 기존 프로젝트 색상 토큰(`background`/`muted`/`card`/`primary`/`foreground` 등)을 유지한다.
- **데이터에 없는 항목은 제외한다.** 참조에 있더라도 현재 DB/모델에 매핑되지 않으면 구현하지 않는다.
- 레이아웃·여백·타이포·컴포넌트 형태(스타일)만 차용한다.

## 범위

1. Header — rounded tab(pill) nav + 원형 로고
2. 포스트 상세 페이지 상단(히어로) 영역
3. 댓글 섹션 UI
4. 본문·댓글 너비 정렬
5. 본문 이미지 클릭 확대(라이트박스) — **신규 기능**

작성 시스템(비밀번호 기반 작성/수정/삭제, 대댓글)·데이터 모델·서버 액션은 **변경하지 않는다.** (5번 이미지 확대 외에는 순수 UI 작업이다.)

---

## 1. Header

대상 파일: `src/components/nav/header.tsx`, `src/components/nav/nav-links.tsx`

### Rounded pill nav

- nav 링크를 `bg-muted` 배경의 알약(pill) 컨테이너로 감싼다 (`rounded-full`, 좌우 패딩).
- 활성 탭: 흰/배경색 칩 + 그림자 (`bg-background shadow-sm rounded-full`).
- 비활성 탭: `text-muted-foreground`, hover 시 `text-foreground`.
- 탭 구성: `블로그`(/posts) · `Tags`(/tags) · `Apps`(/apps).
  - **플레이그라운드(/playground) 탭 제거.**
- active 판정은 기존 `usePathname` + `startsWith` 로직을 재사용한다.

### 로고

- `public/yjlogs-logo.svg`를 원형 배경 안에 배치한다 (`rounded-full`, 약 32~36px).
- SVG의 단색 `fill="black"` path를 `currentColor`로 바꿔 CSS로 색을 제어한다 (인라인 SVG 컴포넌트 또는 `mask`/`currentColor` 처리).
- **Light 모드**: 검정 원(`bg-zinc-900`) + 흰색 로고.
- **Dark 모드**: 흰색 원(`bg-zinc-100`) + 검정 로고 (반전 — 어두운 헤더에서 대비 확보).
- 로고 우측의 `yjlogs`(SITE_NAME) 텍스트는 유지한다.

### 우측 영역

- 기능은 현행 유지: 테마토글(아이콘), 로그인(SignedOut), 유저버튼(SignedIn), 대시보드 버튼(SignedIn).
- pill nav와 시각적으로 어울리도록 아이콘/간격을 정돈한다.
- 검색·언어 토글 등 **현재 기능이 없는 아이콘은 추가하지 않는다.**

---

## 2. 포스트 상세 상단 (히어로)

대상 파일: `src/app/(main)/posts/[slug]/page.tsx`
(필요 시 상단 영역을 `_components/post-header.tsx` 순수 컴포넌트로 분리한다.)

### 구성 (위 → 아래)

1. **← BACK TO INDEX**: 원형 아이콘 버튼(`ChevronLeft`) + 대문자 라벨. `/posts`로 이동하는 `Link`.
2. **카테고리 라벨**: `category.name`을 다이아몬드(◆) 데코 + 작은 대문자 라벨로 표시. 색상 그라데이션은 미적용, 기존 색 체계 유지. `category`가 없으면 라벨 생략.
3. **제목**: `title`을 큰 타이포(`text-4xl`~`text-5xl`, `font-bold`, `leading-tight`)로 확대. 첫 단어 그라데이션 강조는 제외.
4. **메타 줄**: `publishedAt`(date-fns, `ko` 로케일, `yyyy년 M월 d일`) · 조회수(`views.toLocaleString()회 조회`)를 한 줄로.
5. **태그 칩**: `tags`를 둥근 칩으로 메타 줄 아래에 배치. 각 칩은 `/tags/[slug]` 링크.

### 제외 항목 (데이터 없음)

- 작성자명("yjlogs") — DB에 작성자 필드 없음 → 제외.
- 우측 통계 블록(MIN / YEAR / KO ORIGINAL) — 읽기시간·언어 데이터 없음 → **블록 자체 제외.**
- 기존 하단 footer의 태그 블록은 상단 이동에 따라 **제거**한다.

### 본문·TOC

- 본문(`.prose`)과 TOC(`PostToc`) 영역은 현행 유지. 상단 히어로만 개선한다.

---

## 3. 댓글 섹션

대상 파일:
`src/app/(main)/posts/[slug]/_components/comment-section.tsx`,
`comment-list.tsx`, `comment-item.tsx`, `comment-form.tsx`

### 헤더

- `댓글 N개`만 표시한다. (참조의 "반응 86 · 댓글 12" 형태는 흉내내지 않음 — 리액션 데이터 없음.)

### 입력창 카드

- 폼을 카드 컨테이너(`rounded-2xl border bg-card`, 적절한 패딩)로 감싼다.
- 필드 구성(이름/비밀번호/이메일/내용)과 검증(zod), 서버 액션(`createCommentAction`)은 **그대로 유지**한다.
- 제출 버튼·로딩 상태 현행 유지, 카드 톤에 맞게 스타일만 조정.

### 댓글 아이템

- 작성자명(굵게) + 상대 시간(date-fns), 본문, 하단 액션(`답글`/`삭제`).
- 액션은 기존 `setIsReplying` 토글, `DeleteCommentDialogAction` 그대로 사용.
- 삭제된 댓글("삭제된 댓글입니다.") 처리 현행 유지.

### 대댓글

- 들여쓰기 + 좌측 보더 라인(`border-l`)으로 계층을 시각적으로 강화한다. (현재 `ml-8` 단순 들여쓰기 개선.)
- 재귀 렌더링 구조는 현행 유지.

### 제외 항목 (데이터 없음)

- 반응(리액션) 헤더 카운트, 이모지 리액션(👍🔥🙌), 댓글 좋아요(♥), 이미지 첨부 버튼, 이모지 picker, `AUTHOR` 뱃지 — 모두 제외.

### 색상

- 모두 기존 토큰(`muted`/`card`/`primary`/`foreground`/`border`) 사용. 참조 색상(보라 그라데이션 등) 미적용.

---

## 4. 본문·댓글 너비 정렬

대상 파일: `src/app/(main)/posts/[slug]/page.tsx`, `comment-section.tsx`

- 현재: 본문 컨테이너 `max-w-5xl`, 댓글 섹션 `max-w-3xl` → 좌우 폭이 어긋난다.
- **둘 다 `max-w-3xl`로 통일**한다. 본문 컨테이너와 댓글 섹션의 `mx-auto max-w-* px-4`를 동일 폭으로 맞춘다.
- TOC가 있는 글: 본문 article은 `max-w-3xl`을 유지하고 TOC(`PostToc`)는 우측 사이드로 배치한다. 기존 grid(`lg:grid-cols-[1fr_220px]`) 레이아웃에서 본문 폭이 3xl을 넘지 않도록 컨테이너 폭을 조정한다.
- 결과적으로 히어로·본문·댓글이 동일한 좌우 경계선에 정렬된다.

---

## 5. 본문 이미지 클릭 확대 (라이트박스)

대상 파일: 신규 클라이언트 컴포넌트 `posts/[slug]/_components/post-content.tsx` (또는 `_handlers/image-zoom-handler.tsx`)

- 본문은 `dangerouslySetInnerHTML`로 렌더되므로, 본문 wrapper를 클라이언트 컴포넌트로 감싸고 **이벤트 위임**으로 `<img>` 클릭을 감지한다 (wrapper에 onClick → `event.target`이 IMG인지 확인).
- 클릭 시 기존 **shadcn `Dialog`**(`src/components/ui/dialog.tsx`)로 해당 이미지를 중앙 확대 표시한다.
  - 어둡게 딤된 배경 위에 이미지를 화면 비율에 맞춰 확대(`max-w`/`max-h`로 뷰포트 내 제한).
  - 배경 클릭·ESC로 닫기 (Dialog 기본 동작).
  - 추가 라이브러리 의존성 없음. 줌/팬은 범위에서 제외.
- 확대 대상 이미지의 `src`/`alt`를 상태로 보관해 Dialog에 전달한다.
- 이미지에 커서 포인터(`cursor-zoom-in`)를 적용해 클릭 가능함을 시사한다 (prose img 스타일 또는 wrapper에서 처리).
- 본문 HTML 생성 파이프라인(`markdownToHtmlWithToc`/`htmlToHtmlWithToc`)은 변경하지 않는다 — 렌더 후 클라이언트에서 처리한다.

---

## 검증

- `npm run lint` 통과.
- `npm run build` 통과.
- 수동 확인: light/dark 양쪽에서 헤더 로고 가독성, nav active 표시, 포스트 상단 레이아웃, 댓글 작성/대댓글/삭제 동작.
- 너비: 히어로·본문·댓글이 동일 좌우 경계에 정렬되는지 확인.
- 이미지 확대: 본문 이미지 클릭 시 모달 확대, 배경/ESC 닫기 동작 확인.
- 데이터 모델·서버 액션 미변경이므로 `drizzle-kit push` 불필요.
