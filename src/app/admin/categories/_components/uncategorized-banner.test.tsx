import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UncategorizedBanner } from './uncategorized-banner';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

describe('UncategorizedBanner', () => {
  it('미분류 글이 없으면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<UncategorizedBanner posts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('1개면 제목과 지정하기 링크를 보여준다', () => {
    render(<UncategorizedBanner posts={[{ id: 5, title: '테스트' }]} />);

    expect(screen.getByText('미분류 글 1개')).toBeInTheDocument();
    expect(screen.getByText(/“테스트”/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '지정하기' })).toHaveAttribute(
      'href',
      '/admin/posts/5/edit'
    );
  });

  it('여러 개면 개수와 "외 N개"를 함께 보여준다', () => {
    render(
      <UncategorizedBanner
        posts={[
          { id: 5, title: '테스트' },
          { id: 6, title: '두 번째' },
          { id: 7, title: '세 번째' },
        ]}
      />
    );

    expect(screen.getByText('미분류 글 3개')).toBeInTheDocument();
    expect(screen.getByText(/외 2개/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '지정하기' })).toHaveAttribute(
      'href',
      '/admin/posts/5/edit'
    );
  });
});
