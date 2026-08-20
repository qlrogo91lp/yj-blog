import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { savePost } from './save-post';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'user_test' })),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

/** select().from().where().limit()이 최종적으로 이 배열을 resolve한다. */
let selectResult: { publishedAt: Date | null }[] = [];
/** update().set()에 전달된 값을 검증용으로 수집한다. */
const updateSetArgs: Record<string, unknown>[] = [];
/** insert(posts)에 전달된 값을 검증용으로 수집한다(INSERT 경로에서 사용). */
const insertPostsValuesArgs: Record<string, unknown>[] = [];
let insertPostsReturning: { id: number }[] = [{ id: 1 }];

const selectChain = {
  from: vi.fn(() => selectChain),
  where: vi.fn(() => selectChain),
  limit: vi.fn(() => Promise.resolve(selectResult)),
};

const deleteChain = {
  where: vi.fn(() => Promise.resolve(undefined)),
};

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => selectChain),
    update: vi.fn(() => ({
      set: vi.fn((data: Record<string, unknown>) => {
        updateSetArgs.push(data);
        return { where: vi.fn(() => Promise.resolve(undefined)) };
      }),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((data: unknown) => {
        insertPostsValuesArgs.push(data as Record<string, unknown>);
        return {
          returning: vi.fn(() => Promise.resolve(insertPostsReturning)),
        };
      }),
    })),
    delete: vi.fn(() => deleteChain),
  },
}));

const baseInput = {
  postId: 42,
  title: '제목',
  slug: 'post-slug',
  content: '<p>본문</p>',
  categoryId: null,
  seriesId: null,
  status: 'draft' as const,
};

describe('savePost — publishedAt 결정 로직', () => {
  beforeEach(() => {
    vi.mocked(db.select).mockClear();
    vi.mocked(db.update).mockClear();
    vi.mocked(db.insert).mockClear();
    vi.mocked(db.delete).mockClear();
    updateSetArgs.length = 0;
    insertPostsValuesArgs.length = 0;
    insertPostsReturning = [{ id: 1 }];
    selectResult = [];
  });

  it('UPDATE + published + 기존 publishedAt이 있으면 그대로 유지한다', async () => {
    const existing = new Date('2026-01-01T00:00:00Z');
    selectResult = [{ publishedAt: existing }];

    const result = await savePost({ ...baseInput, status: 'published' });

    expect(result.success).toBe(true);
    expect(updateSetArgs).toHaveLength(1);
    expect(updateSetArgs[0].publishedAt).toEqual(existing);
    if (result.success) {
      expect(result.publishedAt).toEqual(existing);
    }
  });

  it('UPDATE + published + 기존 publishedAt이 null이면(첫 발행) 새 Date를 세팅한다', async () => {
    selectResult = [{ publishedAt: null }];
    const before = new Date();

    const result = await savePost({ ...baseInput, status: 'published' });

    expect(result.success).toBe(true);
    expect(updateSetArgs).toHaveLength(1);
    const setPublishedAt = updateSetArgs[0].publishedAt;
    expect(setPublishedAt).not.toBeNull();
    expect(setPublishedAt).toBeInstanceOf(Date);
    expect((setPublishedAt as Date).getTime()).toBeGreaterThanOrEqual(
      before.getTime()
    );
  });

  it('UPDATE + draft면 기존 publishedAt 값과 무관하게 null로 세팅한다', async () => {
    selectResult = [{ publishedAt: new Date('2026-01-01T00:00:00Z') }];

    const result = await savePost({ ...baseInput, status: 'draft' });

    expect(result.success).toBe(true);
    expect(updateSetArgs).toHaveLength(1);
    expect(updateSetArgs[0].publishedAt).toBeNull();
    if (result.success) {
      expect(result.publishedAt).toBeNull();
    }
  });

  it('UPDATE 대상 postId가 DB에 없으면 실패를 반환하고 db.update를 호출하지 않는다', async () => {
    selectResult = [];

    const result = await savePost({ ...baseInput, status: 'published' });

    expect(result).toEqual({ success: false, error: '글을 찾을 수 없습니다' });
    expect(db.update).not.toHaveBeenCalled();
    expect(updateSetArgs).toHaveLength(0);
  });

  it('postId가 없으면(INSERT) publishedAt은 select 없이 status로만 결정한다', async () => {
    const { postId: _postId, ...withoutPostId } = baseInput;

    const result = await savePost({ ...withoutPostId, status: 'published' });

    expect(result.success).toBe(true);
    expect(db.select).not.toHaveBeenCalled();
    expect(insertPostsValuesArgs).toHaveLength(1);
    expect(insertPostsValuesArgs[0].publishedAt).toBeInstanceOf(Date);
  });
});

describe('savePost — contentFormat은 항상 html로 저장된다', () => {
  beforeEach(() => {
    vi.mocked(db.select).mockClear();
    vi.mocked(db.update).mockClear();
    vi.mocked(db.insert).mockClear();
    vi.mocked(db.delete).mockClear();
    updateSetArgs.length = 0;
    insertPostsValuesArgs.length = 0;
    insertPostsReturning = [{ id: 1 }];
    selectResult = [];
  });

  it('UPDATE 경로는 contentFormat을 html로 저장한다', async () => {
    selectResult = [{ publishedAt: null }];

    const result = await savePost({ ...baseInput, status: 'draft' });

    expect(result.success).toBe(true);
    expect(updateSetArgs).toHaveLength(1);
    expect(updateSetArgs[0].contentFormat).toBe('html');
  });

  it('INSERT 경로는 contentFormat을 html로 저장한다', async () => {
    const { postId: _postId, ...withoutPostId } = baseInput;

    const result = await savePost({ ...withoutPostId, status: 'draft' });

    expect(result.success).toBe(true);
    expect(insertPostsValuesArgs).toHaveLength(1);
    expect(insertPostsValuesArgs[0].contentFormat).toBe('html');
  });

  it('호출자가 contentFormat을 다른 값으로 끼워 넣어도 무시하고 html로 저장한다', async () => {
    // SavePostInput 타입에는 contentFormat 필드가 없다 — 타입을 우회해 다른 값을
    // 넣더라도 savePost 내부에서 항상 'html'로 덮어쓰는지를 검증한다(호출자 입력은
    // 무관하다는 것이 실제 테스트 대상 계약이다).
    const { postId: _postId, ...withoutPostId } = baseInput;
    const inputWithForeignContentFormat = {
      ...withoutPostId,
      status: 'draft' as const,
      contentFormat: 'markdown',
    };

    const result = await savePost(inputWithForeignContentFormat);

    expect(result.success).toBe(true);
    expect(insertPostsValuesArgs).toHaveLength(1);
    expect(insertPostsValuesArgs[0].contentFormat).toBe('html');
  });
});
