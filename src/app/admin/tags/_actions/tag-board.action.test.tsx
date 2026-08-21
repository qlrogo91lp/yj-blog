import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TagWithCount } from '@/types';
import { TagBoardAction } from './tag-board.action';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('../_components/tag-chip', () => ({
  TagChip: ({ tag }: { tag: TagWithCount }) => (
    <span data-testid={`chip-${tag.id}`}>#{tag.name}</span>
  ),
}));

vi.mock('@/app/admin/posts/new/_services/add-tag', () => ({
  addTag: vi.fn(async () => ({ success: true, tag: { id: 9, name: 'new', slug: 'new' } })),
}));

vi.mock('../_services/remove-unused-tags', () => ({
  removeUnusedTags: vi.fn(async () => ({ success: true, removed: 1 })),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const tags: TagWithCount[] = [
  { id: 1, name: '4k모니터', slug: '4k', createdAt: new Date(), postCount: 3 },
  { id: 2, name: 'nextjs', slug: 'nextjs', createdAt: new Date(), postCount: 1 },
  { id: 3, name: 'dell', slug: 'dell', createdAt: new Date(), postCount: 0 },
];

describe('TagBoardAction', () => {
  it('사용 중 태그와 미사용 태그를 분리해 렌더한다', () => {
    render(<TagBoardAction tags={tags} />);

    expect(screen.getByText('사용 중')).toBeInTheDocument();
    expect(screen.getByText('글에 쓰이지 않음')).toBeInTheDocument();
    expect(screen.getByTestId('chip-1')).toBeInTheDocument();
    expect(screen.getByTestId('chip-3')).toBeInTheDocument();
  });

  it('미사용 태그가 있으면 정리 버튼을 보여준다', () => {
    render(<TagBoardAction tags={tags} />);
    expect(
      screen.getByRole('button', { name: /미사용 1개 정리/ })
    ).toBeInTheDocument();
  });

  it('미사용 태그가 없으면 정리 버튼과 미사용 섹션이 없다', () => {
    render(<TagBoardAction tags={tags.filter((tag) => tag.postCount > 0)} />);

    expect(screen.queryByText('글에 쓰이지 않음')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /정리/ })).not.toBeInTheDocument();
  });

  it('새 태그 입력창을 렌더한다', () => {
    render(<TagBoardAction tags={tags} />);
    expect(
      screen.getByPlaceholderText('새 태그 이름을 입력하고 Enter')
    ).toBeInTheDocument();
  });

  it('사용 중 태그를 사용 횟수 내림차순으로 정렬하고, 동률이면 이름 순으로 정렬한다', () => {
    const unsorted: TagWithCount[] = [
      { id: 1, name: 'zebra', slug: 'zebra', createdAt: new Date(), postCount: 2 },
      { id: 2, name: 'apple', slug: 'apple', createdAt: new Date(), postCount: 5 },
      { id: 3, name: 'nextjs', slug: 'nextjs', createdAt: new Date(), postCount: 2 },
    ];

    render(<TagBoardAction tags={unsorted} />);

    const chipIds = screen
      .getAllByTestId(/^chip-/)
      .map((el) => el.getAttribute('data-testid'));

    // apple(5) > nextjs(2)=zebra(2)이지만 동률이면 이름 순(nextjs < zebra)
    expect(chipIds).toEqual(['chip-2', 'chip-3', 'chip-1']);
  });
});
