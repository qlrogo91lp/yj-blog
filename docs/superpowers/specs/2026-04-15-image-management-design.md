# 이미지 관리 개선 설계

## 배경

현재 이미지 업로드는 `images/{timestamp}-{filename}` 경로로 R2에 저장되며, 게시글과의 연결 관계가 없다. 이로 인해:

1. 게시글 삭제 시 R2 이미지가 잔존
2. 파일명이 게시글과 무관하여 관리가 어려움
3. `revalidateTag` 시그니처 변경(Next.js 16)으로 캐시 무효화가 동작하지 않아 삭제 후 목록이 갱신되지 않는 버그 존재

## 스코프

| # | 이슈 | 포함 여부 |
|---|------|-----------|
| 1 | 게시글 삭제 시 R2 이미지 잔존 | O |
| 2 | 파일명을 post ID 기반으로 변경 | O |
| 3 | 이미지 업로드 실패 (5MB) | X (재현 후 추적) |
| 4 | 에디터 드래그/붙여넣기 이미지 삽입 | X (별도 플랜) |
| 5 | 삭제 후 목록 동기화 안 됨 (`revalidateTag`) | O |

## 1. DB 스키마 - `post_images` 테이블

```sql
post_images
  id          serial PK
  postId      integer FK -> posts.id (onDelete: cascade)
  key         text NOT NULL           -- R2 오브젝트 키 (images/post-42/image1.png)
  type        text NOT NULL           -- 'thumbnail' | 'content'
  index       integer NOT NULL        -- thumbnail은 0, content는 1, 2, 3...
  createdAt   timestamp DEFAULT now()
```

- `onDelete: cascade` - 게시글 삭제 시 DB row 자동 제거
- `key`는 R2 오브젝트 키만 저장 (URL은 `R2_PUBLIC_URL + "/" + key`로 조합)

## 2. R2 경로 규칙 및 업로드 흐름

### 경로 형식

- 썸네일: `images/post-{id}/thumbnail.{ext}`
- 본문 이미지: `images/post-{id}/image{index}.{ext}`

### 업로드 흐름

```
이미지 업로드 요청
  +- postId 있음 -> 바로 images/post-{id}/ 에 저장
  +- postId 없음 -> 빈 draft 생성하여 postId 확보 -> 저장
```

1. `uploadImage` Server Action이 `postId`와 `type`(thumbnail/content)을 추가로 받음
2. `postId`가 없으면 빈 draft INSERT -> postId 반환 -> 스토어에 세팅
3. `post_images` 테이블에서 해당 postId의 현재 max index 조회 -> 다음 index로 저장
4. R2 업로드 + `post_images` INSERT
5. 결과로 `{ url, postId }` 반환 (첫 업로드 시 postId를 클라이언트에 돌려줘야 함)

### 확장자 처리

원본 파일의 MIME type에서 추출 (예: `image/png` -> `.png`)

## 3. 게시글 삭제 시 R2 이미지 정리

### 삭제 흐름

```
deletePost(postId) 호출
  1. post_images 테이블에서 해당 postId의 key 목록 조회
  2. R2 DeleteObjects로 일괄 삭제
  3. DB에서 post 삭제 (cascade로 post_images도 제거)
  4. revalidateTag
```

- R2 삭제가 실패해도 DB 삭제는 진행 (고아 이미지가 남는 게 글이 안 지워지는 것보다 나음)
- R2 `DeleteObjects`는 한 번에 최대 1000개 삭제 가능 - 개인 블로그에서 초과할 일 없음

## 4. `revalidateTag` 시그니처 수정

Next.js 16에서 `revalidateTag`의 두 번째 인자가 변경됨. `'default'` -> `'max'`로 일괄 수정.

### 대상 파일

- `src/app/admin/posts/_services/delete-post.ts`
- `src/app/admin/posts/new/_services/save-post.ts`
- `src/app/admin/categories/_services/delete-category.ts`
- `src/app/admin/categories/_services/create-category.ts`
- `src/app/admin/categories/_services/update-category.ts`
- `src/app/admin/comments/_components/_delete-comment/_services/delete-comment.ts`
- `src/app/admin/tags/_services/delete-tag.ts`
- `src/app/admin/posts/new/_services/manage-tags.ts`
- `src/app/admin/settings/_services/update-settings.ts`
