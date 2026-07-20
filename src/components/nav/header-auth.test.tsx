import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeaderAdminLink, HeaderAuthButtons } from './header-auth';

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

// 로그인 상태를 가정한 mock: SignedIn은 children을 렌더, SignedOut은 렌더하지 않는다
vi.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: () => null,
  ClerkLoading: () => null,
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <div data-testid="user-button" />,
}));

describe('HeaderAdminLink', () => {
  it('로그인 상태에서 /admin 대시보드 링크를 렌더한다', () => {
    render(<HeaderAdminLink />);
    expect(screen.getByRole('link', { name: '대시보드' })).toHaveAttribute(
      'href',
      '/admin'
    );
  });
});

describe('HeaderAuthButtons', () => {
  it('로그인 상태에서 UserButton을 렌더하고 로그인 버튼은 렌더하지 않는다', () => {
    render(<HeaderAuthButtons />);
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '로그인' })).not.toBeInTheDocument();
  });
});
