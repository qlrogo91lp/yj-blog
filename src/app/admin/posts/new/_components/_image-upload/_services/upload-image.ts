'use server';

import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';

type UploadResult =
  | { url: string; error?: never }
  | { url?: never; error: string };

export async function uploadImage(formData: FormData): Promise<UploadResult> {
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

  // 10MB 제한
  if (file.size > 10 * 1024 * 1024) {
    return { error: '파일 크기는 10MB 이하여야 합니다' };
  }

  try {
    const blob = await put(`blog/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    return { url: blob.url };
  } catch {
    return { error: '업로드에 실패했습니다' };
  }
}
