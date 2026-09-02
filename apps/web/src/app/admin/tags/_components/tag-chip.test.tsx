import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TagWithCount } from '@/types';
import { TagChip } from './tag-chip';

vi.mock('../_actions/delete-tag.action', () => ({
  DeleteTagAction: () => <button type="button">삭제</button>,
}));

const usedTag: TagWithCount = {
  id: 1,
  name: '4k모니터',
  slug: '4k-monitor',
  createdAt: new Date('2026-01-01'),
  postCount: 3,
};

describe('TagChip', () => {
  it('사용 중 태그는 이름과 개수를 보여준다', () => {
    render(<TagChip tag={usedTag} />);

    expect(screen.getByText('#4k모니터')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('사용 중 태그에는 삭제 버튼이 없다', () => {
    render(<TagChip tag={usedTag} />);
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });

  it('미사용 태그는 개수 없이 삭제 버튼을 보여준다', () => {
    render(<TagChip tag={{ ...usedTag, postCount: 0 }} />);

    expect(screen.getByText('#4k모니터')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });
});
