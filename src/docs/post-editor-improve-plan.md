# 글쓰기 페이지 개선 계획

## 이슈 분석

### 1. 글쓰기 중 "글쓰기" 버튼 노출 문제

**현상**: `AdminHeader`(`src/app/admin/_components/admin-header.tsx:13-14`)의 "글쓰기" 버튼이 모든 관리자 페이지에서 항상 표시됨. 글 작성/수정 페이지(`/admin/posts/new`, `/admin/posts/[id]/edit`)에서는 이미 글쓰기 중이므로 버튼이 불필요.

**원인**: `AdminHeader`가 현재 경로를 확인하지 않고 항상 버튼을 렌더링함.

**수정 방안**: `usePathname()`으로 현재 경로를 확인하여 글 작성/수정 페이지에서는 "글쓰기" 버튼을 숨김.

**수정 파일**:
- `src/app/admin/_components/admin-header.tsx` — `usePathname()` 추가, `/admin/posts/new` 또는 `/admin/posts/` + `edit` 경로일 때 버튼 비노출

### 2. 마크다운 모드 제목 입력란 확인

**현상**: 사용자가 마크다운 모드에서 제목 입력란이 없다고 보고.

**코드 분석 결과**: `TitleInputAction`은 `page.tsx:26`에서 모드와 무관하게 항상 렌더링됨. 에디터 모드 전환은 `EditorViewHandler`에서만 발생하며, 제목 입력은 그 위에 위치. 코드 레벨에서는 정상.

**가능한 원인**:
- 마크다운 모드 전환 시 레이아웃이 변경되면서 스크롤 위치 등의 문제로 안 보이는 것처럼 느껴질 수 있음
- 실제 실행 테스트로 확인 필요

**수정 방안**: 실행 확인 후 문제가 재현되면 추가 조사. 현재 코드상으로는 수정 불필요.

### 3. 썸네일 업로드 실패

**현상**: 썸네일 업로드가 동작하지 않음.

**원인 1 — `next.config.ts` Image 도메인 미등록**:
- `next.config.ts:5-9`에 `remotePatterns`가 `*.public.blob.vercel-storage.com`만 등록되어 있음
- R2 Public URL 도메인이 등록되지 않아 `next/image`에서 업로드된 이미지를 렌더링할 수 없음
- 업로드 자체는 성공하더라도 `<Image src={thumbnailUrl} />`에서 차단됨

**원인 2 — 에러 무시**:
- `thumbnail-upload-action.tsx:28-29`에서 `result.url`이 있을 때만 처리하고, `result.error`가 있을 때 아무런 피드백 없음
- 업로드 실패 시 사용자가 원인을 알 수 없음 (silent fail)

**수정 파일**:
- `next.config.ts` — R2 Public URL 도메인을 `remotePatterns`에 추가 (환경 변수 `R2_PUBLIC_URL`에서 hostname 참조)
- `src/app/admin/posts/new/_actions/thumbnail-upload-action.tsx` — 에러 시 toast 또는 alert로 에러 메시지 표시

## 수정 순서

1. `src/app/admin/_components/admin-header.tsx` — 글쓰기/수정 페이지에서 버튼 숨김
2. `next.config.ts` — R2 도메인 remotePatterns 추가
3. `src/app/admin/posts/new/_actions/thumbnail-upload-action.tsx` — 업로드 에러 피드백 추가
4. 마크다운 제목 입력란 — 실행 테스트로 확인 후 필요 시 수정
