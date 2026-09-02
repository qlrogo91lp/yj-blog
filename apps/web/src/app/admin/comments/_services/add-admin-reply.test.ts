import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addAdminReply } from './add-admin-reply';

const authState = vi.hoisted(() => ({ userId: 'user_test' as string | null }));
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: authState.userId })),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

const insertCommentMock = vi.fn(async (..._args: unknown[]) => ({ id: 1 }));
const selectCommentByIdMock = vi.fn(
  async (..._args: unknown[]) => null as { email: string | null } | null
);
vi.mock('@/db/queries/comments', () => ({
  insertComment: (...args: unknown[]) => insertCommentMock(...args),
  selectCommentById: (...args: unknown[]) => selectCommentByIdMock(...args),
}));

const selectPostBySlugMock = vi.fn(async (..._args: unknown[]) => ({
  id: 1,
  title: '테스트 글',
}));
vi.mock('@/db/queries/posts', () => ({
  selectPostBySlug: (...args: unknown[]) => selectPostBySlugMock(...args),
}));

const getBlogSettingsMock = vi.fn(
  async (): Promise<{ blogName: string } | undefined> => ({
    blogName: '운영자블로그',
  })
);
vi.mock('@/db/queries/settings', () => ({
  getBlogSettings: () => getBlogSettingsMock(),
}));

const sendReplyNotificationMock = vi.fn(async (..._args: unknown[]) => {});
vi.mock('@/lib/email', () => ({
  sendReplyNotification: (...args: unknown[]) =>
    sendReplyNotificationMock(...args),
}));

describe('addAdminReply', () => {
  beforeEach(() => {
    authState.userId = 'user_test';
    insertCommentMock.mockClear();
    selectCommentByIdMock.mockReset();
    selectCommentByIdMock.mockResolvedValue(null);
    selectPostBySlugMock.mockClear();
    getBlogSettingsMock.mockClear();
    sendReplyNotificationMock.mockClear();
  });

  it('로그인하지 않았으면 실패하고 댓글을 남기지 않는다', async () => {
    authState.userId = null;
    const result = await addAdminReply(1, 'my-post', 10, { content: '답글' });
    expect(result).toEqual({ success: false, error: '인증이 필요합니다' });
    expect(insertCommentMock).not.toHaveBeenCalled();
  });

  it('내용이 비어있으면 실패한다', async () => {
    const result = await addAdminReply(1, 'my-post', 10, { content: '' });
    expect(result.success).toBe(false);
    expect(insertCommentMock).not.toHaveBeenCalled();
  });

  it('성공하면 블로그 이름을 작성자명으로, isAuthor=true로 댓글을 남긴다', async () => {
    const result = await addAdminReply(1, 'my-post', 10, {
      content: '답글입니다',
    });
    expect(result).toEqual({ success: true });
    expect(insertCommentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: 1,
        parentId: 10,
        authorName: '운영자블로그',
        content: '답글입니다',
        isAuthor: true,
      })
    );
  });

  it('블로그 설정이 없으면 작성자명을 "운영자"로 대체한다', async () => {
    getBlogSettingsMock.mockResolvedValue(undefined);
    await addAdminReply(1, 'my-post', 10, { content: '답글입니다' });
    expect(insertCommentMock).toHaveBeenCalledWith(
      expect.objectContaining({ authorName: '운영자' })
    );
  });

  it('부모 댓글에 이메일이 있으면 답글 알림 이메일을 보낸다', async () => {
    selectCommentByIdMock.mockResolvedValue({ email: 'parent@example.com' });
    await addAdminReply(1, 'my-post', 10, { content: '답글입니다' });
    expect(sendReplyNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'parent@example.com' })
    );
  });

  it('부모 댓글에 이메일이 없으면 알림을 보내지 않는다', async () => {
    selectCommentByIdMock.mockResolvedValue({ email: null });
    await addAdminReply(1, 'my-post', 10, { content: '답글입니다' });
    expect(sendReplyNotificationMock).not.toHaveBeenCalled();
  });

  it('DB 저장 중 예외가 발생하면 실패를 반환한다', async () => {
    insertCommentMock.mockRejectedValueOnce(new Error('db error'));
    const result = await addAdminReply(1, 'my-post', 10, {
      content: '답글입니다',
    });
    expect(result).toEqual({
      success: false,
      error: '답글 작성에 실패했습니다',
    });
  });
});
