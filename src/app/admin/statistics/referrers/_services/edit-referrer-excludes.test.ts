import { beforeEach, describe, expect, it, vi } from 'vitest';
import { editReferrerExcludes } from './edit-referrer-excludes';

const authState = vi.hoisted(() => ({ userId: 'user_test' as string | null }));
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: authState.userId })),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

const updateReferrerExcludesMock = vi.fn(async (_excludes: string[]) => {});
vi.mock('@/db/queries/settings', () => ({
  updateReferrerExcludes: (excludes: string[]) =>
    updateReferrerExcludesMock(excludes),
}));

describe('editReferrerExcludes', () => {
  beforeEach(() => {
    authState.userId = 'user_test';
    updateReferrerExcludesMock.mockClear();
  });

  it('로그인하지 않았으면 실패하고 저장하지 않는다', async () => {
    authState.userId = null;
    const result = await editReferrerExcludes(['t.co']);
    expect(result).toEqual({ success: false, error: '인증이 필요합니다' });
    expect(updateReferrerExcludesMock).not.toHaveBeenCalled();
  });

  it('앞뒤 공백을 정리하고 빈 문자열을 제거한 뒤 저장한다', async () => {
    const result = await editReferrerExcludes([' t.co ', '', 'l.facebook.com']);
    expect(result).toEqual({ success: true });
    expect(updateReferrerExcludesMock).toHaveBeenCalledWith([
      't.co',
      'l.facebook.com',
    ]);
  });

  it('저장 중 예외가 발생하면 실패를 반환한다', async () => {
    updateReferrerExcludesMock.mockRejectedValueOnce(new Error('db error'));
    const result = await editReferrerExcludes(['t.co']);
    expect(result).toEqual({ success: false, error: '저장에 실패했습니다' });
  });
});
