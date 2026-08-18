import { render, screen } from '@testing-library/react';
import { HeroArea } from './hero.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

/**
 * framer-motion은 reduced-motion 상태를 모듈 싱글턴에 캐시한다.
 * 일반 렌더가 한 번이라도 먼저 돌면 false로 굳어버려 static 분기를 탈 수 없으므로,
 * 이 검증은 파일을 분리해 첫 렌더부터 reduced-motion으로 시작한다.
 */
beforeAll(() => {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList
  );
});

describe('HeroArea — prefers-reduced-motion', () => {
  it('sticky pin 없이 문서 흐름으로 렌더한다', () => {
    const { container } = render(<HeroArea />);

    expect(container.firstElementChild).toHaveClass('h-auto');
    expect(container.querySelector('[class*="sticky"]')).toBeNull();
  });

  /**
   * static 분기를 `style={undefined}`로만 만들면 첫 렌더에서 framer-motion이 써둔
   * 인라인 스타일이 남는다 — stage 라벨이 opacity:0으로 굳고 stage가 16vh 밀려
   * CTA를 덮어버린다. 그래서 static 분기는 `motion.*`을 아예 쓰지 않는다.
   */
  it('첫 렌더의 인라인 스타일이 static 분기에 남지 않는다', () => {
    const { container } = render(<HeroArea />);

    expect(screen.getByText('Hole 2 · Par 4 · +3').style.opacity).toBe('');

    const stage = screen
      .getByAltText('GolfCounter hole score dial on Apple Watch')
      .closest('div');
    expect(stage?.style.transform).toBe('');

    expect(container.querySelectorAll('[style*="opacity: 0"]')).toHaveLength(0);
  });

  it('CTA와 칩 4개를 모두 렌더한다', () => {
    render(<HeroArea />);

    expect(screen.getByRole('link', { name: /App Store/i })).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372'
    );
    ['TOTAL', 'HOLES', 'PUTTS', 'BEST'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
