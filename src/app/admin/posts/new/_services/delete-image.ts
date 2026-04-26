'use server';

import { auth } from '@clerk/nextjs/server';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { postImages } from '@/db/schema';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function deleteImage(imageUrl: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl || !imageUrl.startsWith(publicUrl)) return;

  const key = imageUrl.slice(publicUrl.length + 1);

  await Promise.all([
    r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }),
    ),
    db.delete(postImages).where(eq(postImages.key, key)),
  ]);
}
