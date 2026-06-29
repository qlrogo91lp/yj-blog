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
  it('블로그·Tags·Apps 링크를 렌더하고 플레이그라운드는 없다', () => {
    render(<NavLinks />);
    expect(screen.getByRole('link', { name: '블로그' })).toHaveAttribute('href', '/posts');
    expect(screen.getByRole('link', { name: 'Tags' })).toHaveAttribute('href', '/tags');
    expect(screen.getByRole('link', { name: 'Apps' })).toHaveAttribute('href', '/apps');
    expect(screen.queryByRole('link', { name: '플레이그라운드' })).not.toBeInTheDocument();
  });

  it('현재 경로(/posts) 링크가 활성 스타일을 가진다', () => {
    render(<NavLinks />);
    expect(screen.getByRole('link', { name: '블로그' })).toHaveClass('bg-background');
  });
});
