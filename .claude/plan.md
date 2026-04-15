# 이미지 관리 개선 + revalidateTag 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이미지를 게시글 단위로 관리하고, 게시글 삭제 시 R2 이미지를 함께 정리하며, revalidateTag 시그니처 버그를 수정한다.

**Architecture:** `post_images` 테이블로 이미지-게시글 매핑을 관리하고, R2 경로를 `images/post-{id}/` 구조로 변경한다. 게시글 삭제 시 DB 조회 → R2 일괄 삭제 → DB 삭제 순서로 처리한다. `revalidateTag` 두 번째 인자를 `'default'` → `'max'`로 일괄 수정한다.

**Tech Stack:** Next.js 16, Drizzle ORM, Cloudflare R2 (`@aws-sdk/client-s3`), Neon PostgreSQL

**Spec:** `docs/superpowers/specs/2026-04-15-image-management-design.md`

---

## File Structure

| 파일 | 역할 | 생성/수정 |
|------|------|-----------|
| `src/db/schema.ts` | `postImages` 테이블 + relations 추가 | 수정 |
| `src/app/admin/posts/new/_components/_image-upload/_services/upload-image.ts` | postId/type 기반 업로드, draft 자동 생성, post_images INSERT | 수정 |
| `src/app/admin/posts/new/_components/_image-upload/index.tsx` | postId/type을 uploadImage에 전달, 반환된 postId를 스토어에 세팅 | 수정 |
| `src/app/admin/posts/new/_actions/thumbnail-upload-action.tsx` | postId를 uploadImage에 전달, 반환된 postId를 스토어에 세팅 | 수정 |
| `src/app/admin/posts/_services/delete-post.ts` | R2 이미지 일괄 삭제 로직 추가 | 수정 |
| `src/app/admin/posts/_services/delete-post.ts` 외 8개 파일 | `revalidateTag` 두 번째 인자 수정 | 수정 |

---

### Task 1: `post_images` 스키마 추가

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: `postImages` 테이블 정의 추가**

`src/db/schema.ts`의 `postTags` 테이블 위에 추가:

```typescript
// -----------------------------------------------
// post_images (게시글-이미지 매핑)
// -----------------------------------------------

export const postImages = pgTable('post_images', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  type: text('type').notNull(), // 'thumbnail' | 'content'
  index: integer('index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

- [ ] **Step 2: relations 추가**

`postsRelations`에 `postImages: many(postImages)` 추가:

```typescript
export const postsRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  comments: many(comments),
  referrers: many(referrers),
  postTags: many(postTags),
  postImages: many(postImages),
}));
```

`postImages`용 relations도 추가:

```typescript
export const postImagesRelations = relations(postImages, ({ one }) => ({
  post: one(posts, {
    fields: [postImages.postId],
    references: [posts.id],
  }),
}));
```

- [ ] **Step 3: DB에 반영**

Run: `npx drizzle-kit push`
Expected: `post_images` 테이블이 생성됨

- [ ] **Step 4: 커밋**

```bash
git add src/db/schema.ts
git commit -m "feat: post_images 테이블 스키마 추가"
```

---

### Task 2: `uploadImage` Server Action 리팩토링

**Files:**
- Modify: `src/app/admin/posts/new/_components/_image-upload/_services/upload-image.ts`

- [ ] **Step 1: MIME → 확장자 매핑 함수 추가**

파일 상단에 추가:

```typescript
function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/avif': '.avif',
  };
  return map[mimeType] ?? '.png';
}
```

- [ ] **Step 2: draft 자동 생성 함수 추가**

```typescript
import { db } from '@/db';
import { postImages, posts } from '@/db/schema';
import { eq, max } from 'drizzle-orm';

async function createDraftPost(): Promise<number> {
  const [draft] = await db
    .insert(posts)
    .values({
      title: '',
      slug: `draft-${Date.now()}`,
      content: '',
      status: 'draft',
    })
    .returning({ id: posts.id });
  return draft.id;
}
```

- [ ] **Step 3: `uploadImage` 시그니처 변경 및 구현**

기존 함수를 아래로 교체:

```typescript
type UploadResult =
  | { url: string; postId: number; error?: never }
  | { url?: never; postId?: never; error: string };

export async function uploadImage(
  formData: FormData,
  postId: number | null,
  type: 'thumbnail' | 'content',
): Promise<UploadResult> {
  const { userId } = await auth();
  if (!userId) {
    return { error: '인증이 필요합니다' };
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return { error: '파일이 없습니다' };
  }

  if (!file.type.startsWith('image/')) {
    return { error: '이미지 파일만 업로드 가능합니다' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: '파일 크기는 10MB 이하여야 합니다' };
  }

  try {
    const resolvedPostId = postId ?? (await createDraftPost());
    const ext = getExtension(file.type);

    let imageIndex: number;
    let key: string;

    if (type === 'thumbnail') {
      imageIndex = 0;
      key = `images/post-${resolvedPostId}/thumbnail${ext}`;
    } else {
      const result = await db
        .select({ maxIndex: max(postImages.index) })
        .from(postImages)
        .where(eq(postImages.postId, resolvedPostId));
      const currentMax = result[0]?.maxIndex ?? 0;
      imageIndex = currentMax + 1;
      key = `images/post-${resolvedPostId}/image${imageIndex}${ext}`;
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    await db.insert(postImages).values({
      postId: resolvedPostId,
      key,
      type,
      index: imageIndex,
    });

    return { url: `${process.env.R2_PUBLIC_URL}/${key}`, postId: resolvedPostId };
  } catch {
    return { error: '업로드에 실패했습니다' };
  }
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-upload/_services/upload-image.ts
git commit -m "feat: uploadImage를 post ID 기반 경로로 리팩토링"
```

---

### Task 3: 클라이언트 컴포넌트 업데이트

**Files:**
- Modify: `src/app/admin/posts/new/_components/_image-upload/index.tsx`
- Modify: `src/app/admin/posts/new/_actions/thumbnail-upload-action.tsx`

- [ ] **Step 1: `ImageUploadDialog` 수정**

`index.tsx`에서 스토어를 import하고, uploadImage 호출 시 postId/type을 전달:

```typescript
'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNewPostStore } from '../../_store';
import { uploadImage } from './_services/upload-image';

type Props = {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ImageUploadDialog({ editor, open, onOpenChange }: Props) {
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const postId = useNewPostStore((s) => s.postId);
  const setPostId = useNewPostStore((s) => s.setPostId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadImage(formData, postId, 'content');
      if (result.url) {
        setUrl(result.url);
        if (result.postId && !postId) {
          setPostId(result.postId);
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error('업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor || !url) return;
    editor.chain().focus().setImage({ src: url }).run();
    setUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>이미지 삽입</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>파일 업로드</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image-url">또는 URL 직접 입력</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.png"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!url || isUploading}>
              {isUploading ? '업로드 중...' : '삽입'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: `ThumbnailUploadAction` 수정**

`thumbnail-upload-action.tsx`에서 uploadImage 호출에 postId/type 추가:

```typescript
'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadImage } from '../_components/_image-upload/_services/upload-image';
import { useNewPostStore } from '../_store';

const THUMBNAIL_SIZE_LIMIT = 1 * 1024 * 1024; // 1MB

export function ThumbnailUploadAction() {
  const { postId, thumbnailUrl, setPostId, setThumbnailUrl } = useNewPostStore(
    useShallow((state) => ({
      postId: state.postId,
      thumbnailUrl: state.thumbnailUrl,
      setPostId: state.setPostId,
      setThumbnailUrl: state.setThumbnailUrl,
    }))
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > THUMBNAIL_SIZE_LIMIT) {
      toast.error('썸네일은 1MB 이하만 업로드 가능합니다');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadImage(formData, postId, 'thumbnail');
      if (result.url) {
        setThumbnailUrl(result.url);
        if (result.postId && !postId) {
          setPostId(result.postId);
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error('업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
      e.target.value = '';
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
            <X size={16} />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-30"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={16} />
          {isUploading ? '업로드 중...' : '썸네일 추가'}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-upload/index.tsx src/app/admin/posts/new/_actions/thumbnail-upload-action.tsx
git commit -m "feat: 이미지 업로드 클라이언트에서 postId/type 전달"
```

---

### Task 4: 게시글 삭제 시 R2 이미지 정리

**Files:**
- Modify: `src/app/admin/posts/_services/delete-post.ts`

- [ ] **Step 1: R2 클라이언트 및 이미지 삭제 로직 추가**

`delete-post.ts`를 아래로 교체:

```typescript
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { postImages } from '@/db/schema';
import { deletePostById } from '@/db/queries/posts';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

type Result = { success: true } | { success: false; error: string };

export async function deletePost(postId: number): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  try {
    // 1. post_images에서 R2 키 목록 조회
    const images = await db
      .select({ key: postImages.key })
      .from(postImages)
      .where(eq(postImages.postId, postId));

    // 2. R2에서 이미지 일괄 삭제 (실패해도 DB 삭제는 진행)
    if (images.length > 0) {
      try {
        await r2.send(
          new DeleteObjectsCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Delete: {
              Objects: images.map(({ key }) => ({ Key: key })),
            },
          }),
        );
      } catch {
        // R2 삭제 실패는 무시 — 고아 이미지가 남는 게 글이 안 지워지는 것보다 나음
      }
    }

    // 3. DB에서 post 삭제 (cascade로 post_images도 제거)
    const result = await deletePostById(postId);

    if (result.length === 0) {
      return { success: false, error: '글을 찾을 수 없습니다' };
    }

    revalidateTag(CACHE_TAGS.posts, 'max');
    revalidateTag(CACHE_TAGS.comments, 'max');
    revalidatePath('/admin/posts');

    return { success: true };
  } catch {
    return { success: false, error: '삭제에 실패했습니다' };
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/admin/posts/_services/delete-post.ts
git commit -m "feat: 게시글 삭제 시 R2 이미지 일괄 삭제"
```

---

### Task 5: `revalidateTag` 시그니처 일괄 수정

**Files:**
- Modify: `src/app/admin/posts/new/_services/save-post.ts`
- Modify: `src/app/admin/categories/_services/create-category.ts`
- Modify: `src/app/admin/categories/_services/update-category.ts`
- Modify: `src/app/admin/categories/_services/delete-category.ts`
- Modify: `src/app/admin/comments/_components/_delete-comment/_services/delete-comment.ts`
- Modify: `src/app/admin/tags/_services/delete-tag.ts`
- Modify: `src/app/admin/posts/new/_services/manage-tags.ts`
- Modify: `src/app/admin/settings/_services/update-settings.ts`

> 참고: `delete-post.ts`는 Task 4에서 이미 `'max'`로 수정 완료

- [ ] **Step 1: 전체 파일에서 `'default'` → `'max'` 수정**

모든 대상 파일에서 `revalidateTag(CACHE_TAGS.xxx, 'default')` → `revalidateTag(CACHE_TAGS.xxx, 'max')` 로 변경

`save-post.ts` (2곳):
```typescript
// 69행
revalidateTag(CACHE_TAGS.posts, 'max');
// 92행
revalidateTag(CACHE_TAGS.posts, 'max');
```

`create-category.ts`:
```typescript
revalidateTag(CACHE_TAGS.categories, 'max');
```

`update-category.ts`:
```typescript
revalidateTag(CACHE_TAGS.categories, 'max');
```

`delete-category.ts`:
```typescript
revalidateTag(CACHE_TAGS.categories, 'max');
```

`delete-comment.ts`:
```typescript
revalidateTag(CACHE_TAGS.comments, 'max');
```

`delete-tag.ts` (2곳):
```typescript
revalidateTag(CACHE_TAGS.tags, 'max');
revalidateTag(CACHE_TAGS.posts, 'max');
```

`manage-tags.ts`:
```typescript
revalidateTag(CACHE_TAGS.tags, 'max');
```

`update-settings.ts`:
```typescript
revalidateTag(CACHE_TAGS.settings, 'max');
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/posts/new/_services/save-post.ts \
        src/app/admin/categories/_services/create-category.ts \
        src/app/admin/categories/_services/update-category.ts \
        src/app/admin/categories/_services/delete-category.ts \
        src/app/admin/comments/_components/_delete-comment/_services/delete-comment.ts \
        src/app/admin/tags/_services/delete-tag.ts \
        src/app/admin/posts/new/_services/manage-tags.ts \
        src/app/admin/settings/_services/update-settings.ts
git commit -m "fix: revalidateTag 두 번째 인자를 'max'로 수정 (Next.js 16)"
```

---

### Task 6: 수동 검증

- [ ] **Step 1: 개발 서버 시작**

Run: `npm run dev`

- [ ] **Step 2: 이미지 업로드 테스트**

1. `/admin/posts/new`에서 새 글 작성 진입
2. 본문에 이미지 업로드 → R2에 `images/post-{id}/image1.{ext}` 경로로 저장되는지 확인
3. 썸네일 업로드 → R2에 `images/post-{id}/thumbnail.{ext}` 경로로 저장되는지 확인
4. `post_images` 테이블에 row가 생성되었는지 `npx drizzle-kit studio`로 확인

- [ ] **Step 3: 게시글 삭제 테스트**

1. `/admin/posts`에서 테스트 글 삭제
2. **목록이 즉시 갱신되는지 확인** (5번 이슈)
3. R2에서 해당 post 폴더의 이미지가 삭제되었는지 확인
4. `post_images` 테이블에서 해당 row가 삭제되었는지 확인

- [ ] **Step 4: 캐시 무효화 확인**

1. 카테고리 생성/수정/삭제 → 목록 즉시 갱신 확인
2. 태그 삭제 → 목록 즉시 갱신 확인
3. 설정 변경 → 반영 확인
