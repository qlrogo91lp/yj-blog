import { render, screen } from '@testing-library/react';
import { HeroArea } from './hero.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

describe('HeroArea', () => {
  it('배지와 두 줄 헤드라인을 렌더한다', () => {
    render(<HeroArea />);
    expect(
      screen.getByText('Live on Apple Watch & iPhone')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Play the round.Not your phone.'
    );
  });

  it('칩 4개를 모두 렌더한다', () => {
    render(<HeroArea />);
    ['TOTAL', 'HOLES', 'PUTTS', 'BEST'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('App Store CTA가 실제 URL을 가리킨다', () => {
    render(<HeroArea />);
    expect(screen.getByRole('link', { name: /App Store/i })).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372'
    );
  });

  it('최소 버전 문구를 노출한다', () => {
    render(<HeroArea />);
    expect(screen.getByText('Free · watchOS 9.0+')).toBeInTheDocument();
  });

  it('stage 라벨이 hero 이미지에 찍힌 값과 일치한다', () => {
    render(<HeroArea />);
    expect(screen.getByText('Hole 2 · Par 4 · +3')).toBeInTheDocument();
  });

  it('hero 워치 이미지를 alt와 함께 렌더한다', () => {
    render(<HeroArea />);
    expect(
      screen.getByAltText('GolfCounter hole score dial on Apple Watch')
    ).toBeInTheDocument();
  });
});
