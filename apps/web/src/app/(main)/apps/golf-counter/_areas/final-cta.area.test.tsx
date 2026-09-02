import { render, screen } from '@testing-library/react';
import { FinalCtaArea } from './final-cta.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

describe('FinalCtaArea', () => {
  it('최종 CTA 제목과 설명을 렌더한다', () => {
    render(<FinalCtaArea />);
    expect(
      screen.getByRole('heading', { name: 'Ready for the first tee?' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Free on the App Store for Apple Watch and iPhone.')
    ).toBeInTheDocument();
  });

  it('App Store CTA가 실제 URL을 가리킨다', () => {
    render(<FinalCtaArea />);
    expect(screen.getByRole('link', { name: /App Store/i })).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372'
    );
  });

  it('privacy와 support 링크를 노출한다', () => {
    render(<FinalCtaArea />);
    expect(
      screen.getByRole('link', { name: 'Privacy Policy' })
    ).toHaveAttribute('href', '/apps/golf-counter/privacy');
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute(
      'href',
      'mailto:qlrogo91lp@gmail.com'
    );
  });

  it('앱 아이콘을 렌더한다', () => {
    render(<FinalCtaArea />);
    expect(screen.getByAltText('GolfCounter app icon')).toBeInTheDocument();
  });
});
