import React from 'react';
import { render, screen } from '@testing-library/react';
import { RalliSupport } from './ralli-support';

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

describe('RalliSupport', () => {
  it('mailto 링크가 지원 이메일을 가리킨다', () => {
    render(<RalliSupport email="qlrogo91lp@gmail.com" />);
    const mailto = screen.getByRole('link', { name: /qlrogo91lp@gmail.com/i });
    expect(mailto).toHaveAttribute('href', 'mailto:qlrogo91lp@gmail.com');
  });

  it('개인정보 처리방침 링크가 /apps/ralli/privacy를 가리킨다', () => {
    render(<RalliSupport email="qlrogo91lp@gmail.com" />);
    const privacy = screen.getByRole('link', { name: /Privacy Policy/i });
    expect(privacy).toHaveAttribute('href', '/apps/ralli/privacy');
  });
});
