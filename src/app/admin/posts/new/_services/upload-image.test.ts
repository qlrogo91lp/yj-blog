import { beforeEach, describe, expect, it, vi } from 'vitest';

/** PutObjectCommand에 전달된 인자를 순서대로 수집한다. */
const putObjectArgs: Record<string, unknown>[] = [];

// src/lib/r2.ts는 모듈 로드 시점에 R2_BUCKET_NAME/R2_PUBLIC_URL을 읽어 상수로 고정한다.
// 아래 `import './upload-image'`(→ '@/lib/r2' 전이 import)는 ES import 특성상
// 파일 내 다른 top-level 코드보다 먼저 실행되므로, beforeEach의 vi.stubEnv로는
// 이미 평가된 모듈에 값을 반영할 수 없다. import보다 먼저 실행이 보장되는
// vi.hoisted로 값을 설정한다.
vi.hoisted(() => {
  process.env.R2_BUCKET_NAME = 'test-bucket';
  process.env.R2_PUBLIC_URL = 'https://assets.example.com';
});

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
    DeleteObjectsCommand: class {
      constructor(public args: Record<string, unknown>) {}
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
  });

  it('업로드 시 1년짜리 immutable Cache-Control을 부여한다', async () => {
    await uploadImage(buildFormData(), 42, 'thumbnail');

    expect(putObjectArgs).toHaveLength(1);
    expect(putObjectArgs[0].CacheControl).toBe('public, max-age=31536000, immutable');
  });

  it('기존 Key·ContentType 동작을 유지한다', async () => {
    await uploadImage(buildFormData(), 42, 'thumbnail');

    expect(putObjectArgs[0].Key).toMatch(/^images\/post-42\/thumbnail-\d+\.png$/);
    expect(putObjectArgs[0].ContentType).toBe('image/png');
    expect(putObjectArgs[0].Bucket).toBe('test-bucket');
  });

  it('업로드된 공개 URL을 반환한다', async () => {
    const result = await uploadImage(buildFormData(), 42, 'thumbnail');

    expect(result.postId).toBe(42);
    expect(result.url).toMatch(
      /^https:\/\/assets\.example\.com\/images\/post-42\/thumbnail-\d+\.png$/,
    );
  });
});
