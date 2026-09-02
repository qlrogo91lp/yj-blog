import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 클라이언트 (서버 전용).
 * upload-image / save-post(고아 정리) / remove-post가 공유한다.
 */
export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const r2Bucket = process.env.R2_BUCKET_NAME!;
export const r2PublicUrl = process.env.R2_PUBLIC_URL ?? '';

export async function deleteR2Objects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await r2.send(
    new DeleteObjectsCommand({
      Bucket: r2Bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    }),
  );
}
