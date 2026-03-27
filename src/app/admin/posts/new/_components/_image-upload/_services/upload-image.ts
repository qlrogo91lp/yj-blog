'use server';

import { auth } from '@clerk/nextjs/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

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
    const key = `images/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    return { url: `${process.env.R2_PUBLIC_URL}/${key}` };
  } catch {
    return { error: '업로드에 실패했습니다' };
  }
}
