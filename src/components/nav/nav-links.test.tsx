import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NavLinks } from './nav-links';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/posts',
}));

describe('NavLinks', () => {
  it('Home·블로그·시리즈·Tags·Apps 링크를 렌더하고 플레이그라운드는 없다', () => {
    render(<NavLinks />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '블로그' })).toHaveAttribute('href', '/posts');
    expect(screen.getByRole('link', { name: '시리즈' })).toHaveAttribute('href', '/series');
    expect(screen.getByRole('link', { name: 'Tags' })).toHaveAttribute('href', '/tags');
    expect(screen.getByRole('link', { name: 'Apps' })).toHaveAttribute('href', '/apps');
    expect(screen.queryByRole('link', { name: '플레이그라운드' })).not.toBeInTheDocument();
  });

  it('현재 경로(/posts) 링크가 활성 스타일과 슬라이딩 인디케이터를 가진다', () => {
    render(<NavLinks />);
    const activeLink = screen.getByRole('link', { name: '블로그' });
    expect(activeLink).toHaveClass('text-foreground');
    // 활성 링크 내부에 인디케이터(bg-background)가 존재
    expect(activeLink.querySelector('.bg-background')).toBeInTheDocument();
  });

  it('비활성 링크에는 인디케이터가 없다', () => {
    render(<NavLinks />);
    const inactiveLink = screen.getByRole('link', { name: 'Apps' });
    expect(inactiveLink.querySelector('.bg-background')).not.toBeInTheDocument();
  });

  it('홈(/) 링크는 현재 경로가 정확히 /일 때만 활성화된다 (/posts에서는 비활성)', () => {
    render(<NavLinks />);
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink.querySelector('.bg-background')).not.toBeInTheDocument();
  });

  it('plain variant는 인디케이터 없이 텍스트 스타일만 사용한다', () => {
    render(<NavLinks variant="plain" />);
    const activeLink = screen.getByRole('link', { name: '블로그' });
    expect(activeLink).toHaveClass('font-bold');
    expect(activeLink.querySelector('.bg-background')).not.toBeInTheDocument();
  });
});
