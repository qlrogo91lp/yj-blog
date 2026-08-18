import { act } from 'react';
import { render, screen, within } from '@testing-library/react';
import { type Root, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { HealthArea } from './health.area';

// aria-hidden도 검증 대상이라 다른 area 테스트의 mock(src·alt만 전달)보다
// props를 하나 더 전달한다 — health.area.test.tsx와 동일한 이유.
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    'aria-hidden': ariaHidden,
  }: {
    src: string;
    alt: string;
    'aria-hidden'?: boolean;
  }) => <img src={src} alt={alt} aria-hidden={ariaHidden} />,
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
      }) as MediaQueryList,
  );
});

describe('HealthArea — prefers-reduced-motion (정적 출력)', () => {
  it('sticky pin 없이 문서 흐름으로 렌더한다', () => {
    const { container } = render(<HealthArea />);

    expect(container.firstElementChild).toHaveClass('h-auto');
    expect(container.querySelector('[class*="sticky"]')).toBeNull();
  });

  it('스텝 2개를 모두 활성 상태로 렌더한다', () => {
    render(<HealthArea />);

    expect(screen.getByTestId('golf-step-session')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('golf-step-sync')).toHaveAttribute('data-active', 'true');
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
describe('HealthArea — hydration 시퀀스 (회귀)', () => {
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

  it('hydration 완료 후 크로스페이드 이미지에 motion 경로의 stale 인라인 스타일이 남지 않는다', async () => {
    const html = renderToString(<HealthArea />);
    container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    await act(async () => {
      root = hydrateRoot(container as HTMLDivElement, <HealthArea />);
    });

    // 버그 있는 패턴(motion.div + animate={isStatic ? undefined : {...}})이면
    // 첫 렌더(mounted=false)에서 opacity:0/transform으로 찍힌 두 번째 스텝 이미지의
    // 인라인 스타일이 hydration 이후에도 그대로 남는다.
    const syncImage = within(container).getByAltText(
      'GolfCounter on iPhone and Apple Watch together',
    );
    const syncWrapper = syncImage.closest('div');
    expect(syncWrapper?.style.opacity ?? '').not.toBe('0');
    expect(syncWrapper?.style.transform ?? '').toBe('');

    // 활성 스텝(session) 이미지도 같은 이유로 opacity:0에 갇히지 않아야 한다.
    const sessionImage = within(container).getByAltText(
      'GolfCounter workout metrics on Apple Watch',
    );
    const sessionWrapper = sessionImage.closest('div');
    expect(sessionWrapper?.style.opacity ?? '').not.toBe('0');
  });
});
