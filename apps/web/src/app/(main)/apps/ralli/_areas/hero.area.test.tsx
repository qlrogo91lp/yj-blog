import { render, screen } from '@testing-library/react';
import { HeroArea } from './hero.area';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => <img src={src} alt={alt} className={className} />,
}));

describe('HeroArea', () => {
  it('h1으로 태그라인을 렌더한다', () => {
    render(<HeroArea />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Tennis scores,');
    expect(heading).toHaveTextContent('right on your wrist.');
  });

  it('App Store CTA를 렌더한다', () => {
    render(<HeroArea />);
    expect(screen.getByRole('link', { name: /App Store/i })).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/ralli/id6449350578'
    );
  });

  it('장식용 RALLI 글자는 스크린 리더에서 숨긴다', () => {
    const { container } = render(<HeroArea />);
    expect(container.querySelector('[data-ralli-wordmark]')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('초기 스코어는 0이다', () => {
    render(<HeroArea />);
    expect(screen.getByTestId('ralli-hero-score')).toHaveTextContent('0');
  });
});
