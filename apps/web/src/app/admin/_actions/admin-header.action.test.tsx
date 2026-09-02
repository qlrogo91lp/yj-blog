import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminHeaderAction } from './admin-header.action';

const pathname = vi.hoisted(() => ({ current: '/admin/categories' }));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}));

vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button" />,
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: () => <button type="button">사이드바 토글</button>,
}));

describe('AdminHeaderAction', () => {
  beforeEach(() => {
    pathname.current = '/admin/categories';
  });

  it('현재 경로의 브레드크럼을 렌더한다', () => {
    render(<AdminHeaderAction />);

    expect(screen.getByText('콘텐츠')).toBeInTheDocument();
    expect(screen.getByText('카테고리 관리')).toBeInTheDocument();
  });

  it('글쓰기 버튼과 사용자 버튼을 렌더한다', () => {
    render(<AdminHeaderAction />);

    expect(screen.getByRole('link', { name: /글쓰기/ })).toHaveAttribute(
      'href',
      '/admin/posts/new'
    );
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
  });

  it('새 글 작성 화면에서는 브레드크럼과 글쓰기 버튼을 숨긴다', () => {
    pathname.current = '/admin/posts/new';
    render(<AdminHeaderAction />);

    expect(
      screen.queryByRole('link', { name: /글쓰기/ })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('콘텐츠')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'YJlogs' })).toHaveAttribute(
      'href',
      '/admin'
    );
  });

  it('글 수정 화면에서도 동일하게 숨긴다', () => {
    pathname.current = '/admin/posts/12/edit';
    render(<AdminHeaderAction />);

    expect(
      screen.queryByRole('link', { name: /글쓰기/ })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'YJlogs' })).toBeInTheDocument();
  });

  it('브레드크럼이 없는 경로에서는 브레드크럼 영역을 비운다', () => {
    pathname.current = '/admin/unknown';
    render(<AdminHeaderAction />);

    expect(screen.getByRole('link', { name: /글쓰기/ })).toBeInTheDocument();
    expect(screen.queryByText('콘텐츠')).not.toBeInTheDocument();
  });
});
