'use server';

import { auth } from '@clerk/nextjs/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq, max } from 'drizzle-orm';
import { db } from '@/db';
import { postImages, posts } from '@/db/schema';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

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
