import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** PutObjectCommand에 전달된 인자를 순서대로 수집한다. */
const putObjectArgs: Record<string, unknown>[] = [];

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class {
      send = vi.fn().mockResolvedValue({});
    },
    PutObjectCommand: class {
      constructor(args: Record<string, unknown>) {
        putObjectArgs.push(args);
      }
    },
  };
});

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'user_test' })),
}));

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(async () => undefined),
    })),
  },
}));

import { uploadImage } from './upload-image';

function buildFormData(): FormData {
  const formData = new FormData();
  formData.append('file', new File(['fake-bytes'], 'thumb.png', { type: 'image/png' }));
  return formData;
}

describe('uploadImage', () => {
  beforeEach(() => {
    putObjectArgs.length = 0;
    vi.stubEnv('R2_BUCKET_NAME', 'test-bucket');
    vi.stubEnv('R2_PUBLIC_URL', 'https://assets.example.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('업로드 시 1년짜리 immutable Cache-Control을 부여한다', async () => {
    await uploadImage(buildFormData(), 42, 'thumbnail');

    expect(putObjectArgs).toHaveLength(1);
    expect(putObjectArgs[0].CacheControl).toBe('public, max-age=31536000, immutable');
  });

  it('기존 Key·ContentType 동작을 유지한다', async () => {
    await uploadImage(buildFormData(), 42, 'thumbnail');

    expect(putObjectArgs[0].Key).toBe('images/post-42/thumbnail.png');
    expect(putObjectArgs[0].ContentType).toBe('image/png');
    expect(putObjectArgs[0].Bucket).toBe('test-bucket');
  });

  it('업로드된 공개 URL을 반환한다', async () => {
    const result = await uploadImage(buildFormData(), 42, 'thumbnail');

    expect(result).toEqual({
      url: 'https://assets.example.com/images/post-42/thumbnail.png',
      postId: 42,
    });
  });
});
