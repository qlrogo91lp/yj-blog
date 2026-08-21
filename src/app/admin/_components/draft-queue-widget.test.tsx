import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DraftQueueWidget } from './draft-queue-widget';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const drafts = [
  { id: 1, title: '키보드 배열 바꾸고 3개월', updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 2, title: '', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
];

describe('DraftQueueWidget', () => {
  it('제목과 개수를 렌더한다', () => {
    render(<DraftQueueWidget drafts={drafts} totalCount={2} />);

    expect(screen.getByText('이어 쓸 글')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('목록에 담기지 않은 나머지도 포함한 전체 개수를 뱃지로 보여준다', () => {
    // limit으로 목록은 2건만 내려와도, 뱃지는 전체 임시저장 글 개수(7)를 보여줘야 한다.
    render(<DraftQueueWidget drafts={drafts} totalCount={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('각 글을 편집 화면으로 링크한다', () => {
    render(<DraftQueueWidget drafts={drafts} totalCount={2} />);
    expect(
      screen.getByRole('link', { name: /키보드 배열 바꾸고 3개월/ })
    ).toHaveAttribute('href', '/admin/posts/1/edit');
  });

  it('상대시각으로 표시한다', () => {
    render(<DraftQueueWidget drafts={drafts} totalCount={2} />);
    // 두 항목 모두 상대시각이 "전"으로 끝나므로 getAllByText로 확인한다.
    expect(screen.getAllByText(/전$/).length).toBeGreaterThan(0);
  });

  it('제목이 비면 (제목 없음)으로 표시한다', () => {
    render(<DraftQueueWidget drafts={drafts} totalCount={2} />);
    expect(screen.getByRole('link', { name: /\(제목 없음\)/ })).toBeInTheDocument();
  });

  it('임시저장 글이 없으면 빈 상태를 보여준다', () => {
    render(<DraftQueueWidget drafts={[]} totalCount={0} />);
    expect(screen.getByText('이어 쓸 글이 없습니다.')).toBeInTheDocument();
  });
});
