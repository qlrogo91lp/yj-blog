import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteUnusedTags } from '@/db/queries/tags';
import { removeUnusedTags } from './remove-unused-tags';

const authState = vi.hoisted(() => ({ userId: 'user_test' as string | null }));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: authState.userId })),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/db/queries/tags', () => ({
  deleteUnusedTags: vi.fn(async () => [{ id: 1 }, { id: 2 }]),
}));

describe('removeUnusedTags', () => {
  beforeEach(() => {
    authState.userId = 'user_test';
    vi.mocked(deleteUnusedTags).mockClear();
    vi.mocked(deleteUnusedTags).mockResolvedValue([{ id: 1 }, { id: 2 }]);
  });

  it('로그인하지 않았으면 실패하고 DB를 건드리지 않는다', async () => {
    authState.userId = null;

    const result = await removeUnusedTags();

    expect(result).toEqual({ success: false, error: '인증이 필요합니다' });
    expect(deleteUnusedTags).not.toHaveBeenCalled();
  });

  it('삭제된 태그 개수를 돌려준다', async () => {
    const result = await removeUnusedTags();

    expect(result).toEqual({ success: true, removed: 2 });
  });

  it('지울 태그가 없어도 성공하고 0을 돌려준다', async () => {
    vi.mocked(deleteUnusedTags).mockResolvedValue([]);

    const result = await removeUnusedTags();

    expect(result).toEqual({ success: true, removed: 0 });
  });

  it('쿼리가 던지면 실패 결과로 감싼다', async () => {
    vi.mocked(deleteUnusedTags).mockRejectedValue(new Error('db down'));

    const result = await removeUnusedTags();

    expect(result).toEqual({
      success: false,
      error: '미사용 태그 정리에 실패했습니다',
    });
  });
});
