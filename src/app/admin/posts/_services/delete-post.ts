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
