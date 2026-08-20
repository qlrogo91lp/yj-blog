import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebarAction } from './admin-sidebar.action';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  } & Record<string, unknown>) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/categories',
}));

function renderSidebar(props: { pendingReplyCount?: number } = {}) {
  return render(
    <SidebarProvider>
      <AdminSidebarAction {...props} />
    </SidebarProvider>
  );
}

describe('AdminSidebarAction', () => {
  it('콘텐츠·통계 메뉴와 그룹 라벨을 렌더한다', () => {
    renderSidebar();

    expect(screen.getByText('콘텐츠')).toBeInTheDocument();
    expect(screen.getByText('통계')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '글 관리' })).toHaveAttribute(
      'href',
      '/admin/posts'
    );
    expect(screen.getByRole('link', { name: /유입경로/ })).toHaveAttribute(
      'href',
      '/admin/statistics/referrers'
    );
  });

  it('블로그 설정과 블로그 보기는 하단에 있다', () => {
    renderSidebar();

    expect(screen.getByRole('link', { name: /블로그 설정/ })).toHaveAttribute(
      'href',
      '/admin/settings'
    );
    expect(screen.getByRole('link', { name: /블로그 보기/ })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('현재 경로 항목만 활성 상태로 표시된다', () => {
    renderSidebar();

    expect(
      screen.getByRole('link', { name: /카테고리 관리/ }).closest('[data-active]')
    ).toHaveAttribute('data-active', 'true');
    expect(
      screen.getByRole('link', { name: '글 관리' }).closest('[data-active]')
    ).toHaveAttribute('data-active', 'false');
  });

  it('대시보드는 정확히 /admin일 때만 활성화된다', () => {
    renderSidebar();

    expect(
      screen.getByRole('link', { name: /대시보드/ }).closest('[data-active]')
    ).toHaveAttribute('data-active', 'false');
  });

  it('답변 대기 수가 있으면 댓글 관리에 뱃지를 렌더한다', () => {
    renderSidebar({ pendingReplyCount: 2 });
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('답변 대기 수가 0이면 뱃지를 렌더하지 않는다', () => {
    renderSidebar({ pendingReplyCount: 0 });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('답변 대기 수를 주지 않으면 뱃지를 렌더하지 않는다', () => {
    const { container } = renderSidebar();
    expect(
      container.querySelector('[data-slot="sidebar-menu-badge"]')
    ).not.toBeInTheDocument();
  });
});
