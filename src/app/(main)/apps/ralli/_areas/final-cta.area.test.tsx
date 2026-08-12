import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { FinalCtaArea } from './final-cta.area';

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

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('FinalCtaArea', () => {
  it('최종 CTA 카피와 App Store 버튼을 렌더한다', () => {
    render(<FinalCtaArea />);
    expect(screen.getByRole('heading', { name: 'Go win the next one.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /App Store/i })).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/ralli/id6449350578',
    );
  });

  it('Privacy와 Support 링크를 렌더한다', () => {
    render(<FinalCtaArea />);
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/apps/ralli/privacy',
    );
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute(
      'href',
      'mailto:qlrogo91lp@gmail.com',
    );
  });

  it('공용 Footer와 중복되는 저작권 문구를 넣지 않는다', () => {
    render(<FinalCtaArea />);
    expect(screen.queryByText(/YJlogs/)).not.toBeInTheDocument();
  });
});
