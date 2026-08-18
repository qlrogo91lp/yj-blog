import { act } from 'react';
import { render, screen, within } from '@testing-library/react';
import { type Root, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
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

describe('HeroArea — prefers-reduced-motion (정적 출력)', () => {
  it('sticky pin 없이 문서 흐름으로 렌더한다', () => {
    const { container } = render(<HeroArea />);

    expect(container.firstElementChild).toHaveClass('h-auto');
    expect(container.querySelector('[class*="sticky"]')).toBeNull();
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

/**
 * hydration 회귀 테스트.
 *
 * RTL의 render()는 내부적으로 createRoot를 쓴다. createRoot 트리에서는
 * useSyncExternalStore가 getServerSnapshot을 절대 소비하지 않으므로 `mounted`가
 * 첫 렌더부터 이미 true다 — "motion 경로가 mounted=false로 먼저 mount되고,
 * framer-motion이 인라인 스타일을 DOM에 직접 쓴 다음, isStatic이 true로 바뀌며
 * style이 undefined가 되어도 그 인라인 스타일이 지워지지 않는" 실제 버그 시퀀스를
 * 절대 재현하지 못한다 (위 describe 블록의 두 테스트가 여기 해당하지 않는 이유).
 *
 * 그래서 이 블록만 renderToString(서버 렌더 — useSyncExternalStore가 getServerSnapshot을
 * 써서 mounted=false)으로 HTML을 만든 뒤, 그 HTML을 hydrateRoot로 하이드레이션한다.
 * hydrateRoot의 첫 렌더 패스도 서버 HTML과 맞추기 위해 mounted=false를 쓰고,
 * 커밋 이후 실제 getSnapshot(mounted=true)과 비교해 값이 다르면 자동으로 재렌더한다.
 * 이 재렌더가 "motion 경로 mount → isStatic 플립"의 실제 시퀀스다.
 */
describe('HeroArea — hydration 시퀀스 (회귀)', () => {
  let container: HTMLDivElement | undefined;
  let root: Root | undefined;

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    container = undefined;
    root = undefined;
  });

  it('hydration 완료 후 stage 라벨·stage에 motion 경로의 stale 인라인 스타일이 남지 않는다', async () => {
    const html = renderToString(<HeroArea />);
    container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    await act(async () => {
      root = hydrateRoot(container as HTMLDivElement, <HeroArea />);
    });

    // 버그 있는 패턴(motion.div + style={isStatic ? undefined : {...}})이면
    // 첫 렌더(mounted=false)에서 opacity:0으로 찍힌 인라인 스타일이 그대로 남는다.
    const label = within(container).getByText('Hole 2 · Par 4 · +3');
    expect(label.style.opacity).not.toBe('0');

    // 버그 있는 패턴이면 stage가 첫 렌더의 translateY(16vh)에 그대로 갇힌다.
    const stage = within(container)
      .getByAltText('GolfCounter hole score dial on Apple Watch')
      .closest('div');
    expect(stage?.style.transform ?? '').not.toMatch(/translateY/);

    // CTA도 같은 이유로 opacity:1(보임)이어야 페이드아웃된 채 멈춰 있지 않다.
    const cta = within(container).getByRole('link', { name: /App Store/i });
    const ctaWrapper = cta.closest('a')?.parentElement;
    expect(ctaWrapper?.style.opacity ?? '').not.toBe('0');
  });
});
