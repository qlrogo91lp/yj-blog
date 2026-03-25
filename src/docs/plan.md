# 수정 계획: 썸네일 전체 구현 (표시 + 입력)

> 작성일: 2026-03-25

## 현재 구조

```
src/
├── components/post/
│   ├── post-card.tsx                          ← [High] 썸네일 표시 미구현
│   └── post-list-item.tsx                     ← (변경 없음, 이미 구현됨)
├── app/admin/posts/
│   ├── new/
│   │   ├── _store.ts                          ← [High] thumbnailUrl 필드 없음
│   │   ├── _services/save-post.ts             ← [High] thumbnailUrl 저장 안 함
│   │   ├── _actions/                          ← [High] ThumbnailUploadAction 신규 생성
│   │   ├── _components/_image-upload/         ← uploadImage() 재사용
│   │   └── page.tsx                           ← [High] ThumbnailUploadAction 추가
│   └── [id]/edit/
│       ├── page.tsx                           ← [High] ThumbnailUploadAction 추가
│       └── _handlers/post-init-handler.tsx    ← [High] thumbnailUrl 초기화 누락
next.config.ts                                 ← [High] images.remotePatterns 미설정
```

## 분석 요약

### 문제점

1. **`post-card.tsx` — 썸네일 렌더링 없음**
   - `post.thumbnailUrl` 필드가 타입/DB에 있으나 카드 UI에서 미사용

2. **`next.config.ts` — `images.remotePatterns` 미설정**
   - next/image로 외부 URL 사용 시 필수. Vercel Blob 도메인 미등록

3. **`_store.ts` — `thumbnailUrl` 필드 없음**
   - State, Action, reset(), initializePost() 모두 thumbnailUrl 미포함

4. **`save-post.ts` — thumbnailUrl 저장 안 함**
   - `SavePostInput` 타입, INSERT/UPDATE 쿼리 모두 thumbnailUrl 미반영

5. **`post-init-handler.tsx` — thumbnailUrl 초기화 누락**
   - 편집 페이지 진입 시 기존 thumbnailUrl을 스토어에 로드하지 않음

6. **썸네일 업로드 UI 없음**
   - 에디터에서 thumbnailUrl을 입력할 컴포넌트가 없음

---

## 수정 계획

### 1. [High] next.config.ts — images.remotePatterns 추가

**현재 코드**
```ts
const nextConfig: NextConfig = {
  async headers() { ... },
};
```

**수정 후**
```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async headers() { ... },
};
```

**이유**: next/image로 Vercel Blob URL 이미지를 렌더링하려면 허용 도메인 등록 필수.

---

### 2. [High] _store.ts — thumbnailUrl 필드 추가

**수정 위치**: `State` 타입, `Action` 타입, 초기값, `reset()`, `initializePost()`

**수정 후**
```ts
type State = {
  // ...기존 필드...
  thumbnailUrl: string | null;  // 추가
};

type Action = {
  // ...기존 액션...
  setThumbnailUrl: (url: string | null) => void;  // 추가
  initializePost: (data: {
    // ...기존 필드...
    thumbnailUrl: string | null;  // 추가
  }) => void;
};

// 초기값
thumbnailUrl: null,

// setThumbnailUrl 구현
setThumbnailUrl: (thumbnailUrl) => set({ thumbnailUrl }),

// reset() 내부
thumbnailUrl: null,

// initializePost() 내부 — spread에 자동 포함됨 (data에 thumbnailUrl 추가)
```

**이유**: 썸네일 URL을 에디터 전역 상태로 관리해야 업로드 액션 → 저장 로직이 연결됨.

---

### 3. [High] save-post.ts — thumbnailUrl 저장 반영

**수정 위치**: `SavePostInput` 타입, INSERT/UPDATE 쿼리

**수정 후**
```ts
type SavePostInput = {
  // ...기존 필드...
  thumbnailUrl?: string | null;  // 추가
};

// UPDATE
const updateData = {
  // ...기존 필드...
  thumbnailUrl: input.thumbnailUrl ?? null,  // 추가
};

// INSERT .values()
{
  // ...기존 필드...
  thumbnailUrl: input.thumbnailUrl ?? null,  // 추가
}
```

**이유**: 스토어의 thumbnailUrl이 실제 DB에 저장되려면 savePost 로직에 반영 필수.

---

### 4. [High] post-init-handler.tsx — thumbnailUrl 초기화 추가

**현재 코드**
```ts
useNewPostStore.getState().initializePost({
  postId: post.id,
  title: post.title,
  // ...
  // thumbnailUrl 없음
});
```

**수정 후**
```ts
useNewPostStore.getState().initializePost({
  postId: post.id,
  title: post.title,
  // ...
  thumbnailUrl: post.thumbnailUrl ?? null,  // 추가
});
```

**이유**: 편집 페이지 진입 시 기존 thumbnailUrl을 스토어에 로드해야 UI에 기존 썸네일이 표시됨.

---

### 5. [High] ThumbnailUploadAction.tsx 신규 생성

**경로**: `src/app/admin/posts/new/_actions/thumbnail-upload-action.tsx`

**전체 코드**
```tsx
'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '../_components/_image-upload/_services/upload-image';
import { useNewPostStore } from '../_store';

export function ThumbnailUploadAction() {
  const { thumbnailUrl, setThumbnailUrl } = useNewPostStore(
    useShallow(state => ({
      thumbnailUrl: state.thumbnailUrl,
      setThumbnailUrl: state.setThumbnailUrl,
    }))
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadImage(formData);
      if (result.url) setThumbnailUrl(result.url);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {thumbnailUrl ? (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border">
          <Image src={thumbnailUrl} alt="썸네일" fill className="object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => setThumbnailUrl(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          {isUploading ? '업로드 중...' : '썸네일 추가'}
        </Button>
      )}
    </div>
  );
}
```

**이유**: 에디터에서 썸네일을 업로드·미리보기·제거하는 전용 Action 컴포넌트. 기존 `uploadImage()` 서버 액션 재사용.

---

### 6. [High] new/page.tsx & edit/page.tsx — ThumbnailUploadAction 삽입

**수정 위치**: CategorySelectorAction 아래, TitleInputAction 위

```tsx
<CategorySelectorAction categories={categories} />
<ThumbnailUploadAction />   {/* 추가 */}
<TitleInputAction />
```

두 페이지 모두 동일하게 적용.

**이유**: 썸네일 입력 UI를 에디터 본문 영역에 노출.

---

### 7. [High] post-card.tsx — 썸네일 이미지 표시

**현재 코드**
```tsx
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { PostWithCategory } from '@/types';

interface Props {
  post: PostWithCategory;
}

export function PostCard({ post }: Props) {
  return (
    <Link href={`/posts/${post.slug}`} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>...</CardHeader>
        ...
      </Card>
    </Link>
  );
}
```

**수정 후**
```tsx
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { PostWithCategory } from '@/types';

type Props = {
  post: PostWithCategory;
};

export function PostCard({ post }: Props) {
  return (
    <Link href={`/posts/${post.slug}`} className="block">
      <Card
        className={cn(
          'h-full overflow-hidden transition-shadow hover:shadow-md',
          post.thumbnailUrl && 'pt-0'
        )}
      >
        {post.thumbnailUrl && (
          <div className="relative aspect-video w-full">
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader>...</CardHeader>
        ...
      </Card>
    </Link>
  );
}
```

**이유**:
- 카드 상단 full-width 썸네일 표시 (`aspect-video` 비율)
- 썸네일 있을 때만 `pt-0`로 Card 상단 패딩 제거해 이미지가 카드 테두리에 밀착
- `overflow-hidden`으로 `rounded-xl` 모서리 처리
- `interface Props` → `type Props` 컨벤션 수정

---

## 변경 후 구조

```
src/
├── components/post/
│   └── post-card.tsx                          ✅ 썸네일 표시 + type Props 수정
├── app/admin/posts/
│   ├── new/
│   │   ├── _store.ts                          ✅ thumbnailUrl 필드/액션 추가
│   │   ├── _services/save-post.ts             ✅ thumbnailUrl INSERT/UPDATE 반영
│   │   ├── _actions/thumbnail-upload-action.tsx  ✅ 신규 생성
│   │   └── page.tsx                           ✅ ThumbnailUploadAction 삽입
│   └── [id]/edit/
│       ├── page.tsx                           ✅ ThumbnailUploadAction 삽입
│       └── _handlers/post-init-handler.tsx    ✅ thumbnailUrl 초기화 추가
next.config.ts                                 ✅ images.remotePatterns 추가
```

## 체크리스트

**인프라**
- [ ] `next.config.ts`에 `images.remotePatterns` 추가 (Vercel Blob 도메인)

**스토어 & 저장 로직**
- [ ] `_store.ts` — `thumbnailUrl` State/Action/reset/initializePost 추가
- [ ] `save-post.ts` — `SavePostInput`에 `thumbnailUrl` 추가, INSERT/UPDATE 반영

**에디터 UI**
- [ ] `thumbnail-upload-action.tsx` 신규 생성
- [ ] `new/page.tsx` — `ThumbnailUploadAction` 삽입
- [ ] `edit/page.tsx` — `ThumbnailUploadAction` 삽입
- [ ] `post-init-handler.tsx` — `thumbnailUrl` 초기화 추가

**카드 표시**
- [ ] `post-card.tsx` — `Image`, `cn` import 추가
- [ ] `post-card.tsx` — `interface Props` → `type Props` 수정
- [ ] `post-card.tsx` — 썸네일 영역 추가 (`overflow-hidden`, `pt-0` 조건부, `aspect-video`)
