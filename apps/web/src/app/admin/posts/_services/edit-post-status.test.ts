import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updatePostStatus } from '@/db/queries/posts';
import { editPostStatus } from './edit-post-status';

const authState = vi.hoisted(() => ({ userId: 'user_test' as string | null }));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: authState.userId })),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/db/queries/posts', () => ({
  updatePostStatus: vi.fn(async () => [{ id: 1 }]),
}));

describe('editPostStatus', () => {
  beforeEach(() => {
    authState.userId = 'user_test';
    vi.mocked(updatePostStatus).mockClear();
    vi.mocked(updatePostStatus).mockResolvedValue([{ id: 1 }]);
  });

  it('로그인하지 않았으면 실패하고 DB를 건드리지 않는다', async () => {
    authState.userId = null;

    const result = await editPostStatus(1, 'published');

    expect(result).toEqual({ success: false, error: '인증이 필요합니다' });
    expect(updatePostStatus).not.toHaveBeenCalled();
  });

  it('발행으로 전환하면 쿼리를 published로 호출한다', async () => {
    const result = await editPostStatus(7, 'published');

    expect(result).toEqual({ success: true });
    expect(updatePostStatus).toHaveBeenCalledWith(7, 'published');
  });

  it('임시저장으로 전환하면 쿼리를 draft로 호출한다', async () => {
    const result = await editPostStatus(7, 'draft');

    expect(result).toEqual({ success: true });
    expect(updatePostStatus).toHaveBeenCalledWith(7, 'draft');
  });

  it('정의되지 않은 상태값이면 실패한다', async () => {
    // @ts-expect-error 런타임 방어를 검증한다
    const result = await editPostStatus(7, 'archived');

    expect(result).toEqual({ success: false, error: '잘못된 상태값입니다' });
    expect(updatePostStatus).not.toHaveBeenCalled();
  });

  it('갱신된 행이 없으면 실패한다', async () => {
    vi.mocked(updatePostStatus).mockResolvedValue([]);

    const result = await editPostStatus(999, 'published');

    expect(result).toEqual({ success: false, error: '글을 찾을 수 없습니다' });
  });

  it('쿼리가 던지면 실패 결과로 감싼다', async () => {
    vi.mocked(updatePostStatus).mockRejectedValue(new Error('db down'));

    const result = await editPostStatus(7, 'published');

    expect(result).toEqual({
      success: false,
      error: '상태 변경에 실패했습니다',
    });
  });
});
