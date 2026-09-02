import { act } from 'react';
import { type Root, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { ReplayArea } from './replay.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

/**
 * framer-motion은 reduced-motion 상태를 모듈 싱글턴에 캐시한다.
 * 일반 렌더가 한 번이라도 먼저 돌면 false로 굳어 static 분기에 진입할 수 없으므로,
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

/**
 * 실제 브라우저의 SSR → hydration 시퀀스를 재현한다.
 *
 * RTL의 render()는 createRoot를 쓰는데, createRoot는 useSyncExternalStore의
 * getServerSnapshot(= mounted:false)을 호출하지 않는다. 즉 mounted가 첫 렌더부터
 * true여서 "motion 경로가 먼저 마운트되고 → framer-motion이 인라인 스타일을 쓰고
 * → isStatic이 true로 뒤집힌다"는 결함 시퀀스가 재현되지 않는다.
 * renderToString + hydrateRoot만이 이 순서를 만든다.
 */
async function hydrateReplay() {
  const container = document.createElement('div');
  container.innerHTML = renderToString(<ReplayArea />);
  document.body.appendChild(container);

  let root: Root;
  await act(async () => {
    root = hydrateRoot(container, <ReplayArea />);
  });

  return {
    container,
    cleanup: async () => {
      await act(async () => {
        root!.unmount();
      });
      container.remove();
    },
  };
}

describe('ReplayArea — reduced-motion hydration 회귀', () => {
  it('갤러리 래퍼에 stale 인라인 transform이 남지 않는다', async () => {
    const { container, cleanup } = await hydrateReplay();

    const shotWrapper = container.querySelector('img')?.closest('div');
    const galleryWrapper = shotWrapper?.parentElement;
    expect(galleryWrapper).toBeTruthy();
    expect(galleryWrapper?.style.transform).toBe('');

    await cleanup();
  });

  it('갤러리 이미지가 DOM에 모두 존재한다', async () => {
    const { container, cleanup } = await hydrateReplay();

    expect(container.querySelectorAll('img').length).toBe(5);

    await cleanup();
  });
});
