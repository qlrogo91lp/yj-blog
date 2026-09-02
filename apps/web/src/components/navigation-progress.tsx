'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useNProgress } from '@tanem/react-nprogress';
import { flushSync } from 'react-dom';

/**
 * 전환이 이 시간보다 빨리 끝나면 바를 아예 띄우지 않는다.
 * 웜 전환은 100ms 안팎이라 지연이 없으면 깜빡이고 사라져 오히려 산만하다.
 */
const showDelayMs = 150;

/**
 * 네비게이션이 완료 신호 없이 끝난 경우(중단·오류) 바가 영원히 도는 것을 막는 안전장치.
 */
const maxDurationMs = 10000;

/**
 * 이 클릭이 프로그레스 바를 띄워야 할 내부 네비게이션인지 판정한다.
 *
 * App Router에는 "네비게이션 시작" 이벤트가 없어 앵커 클릭을 직접 가로채야 하고,
 * 브라우저 기본 동작으로 처리되는 클릭(새 탭·다운로드·외부 링크·해시)을
 * 걸러내지 않으면 바가 떴다가 사라지지 않는다.
 */
export function shouldStartProgress(
  event: MouseEvent,
  anchor: HTMLAnchorElement | null,
  currentPathname: string
): boolean {
  if (!anchor) return false;
  if (event.defaultPrevented) return false;

  // 좌클릭 외에는 브라우저가 새 탭·컨텍스트 메뉴 등으로 처리한다.
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return false;

  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  if (!anchor.getAttribute('href')) return false;

  // mailto:·tel:은 origin이 'null'이 되어 여기서 함께 걸러진다.
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;

  // 같은 문서 내 해시 이동은 라우트 전환이 아니다.
  if (url.hash && url.pathname === currentPathname) return false;

  // 같은 경로 재클릭은 전환이 일어나지 않아 완료 신호도 오지 않는다.
  if (url.pathname === currentPathname && url.search === window.location.search)
    return false;

  return true;
}

/**
 * 라우트 전환 중 화면 상단에 얇은 진행 바를 표시한다.
 *
 * `loading.tsx`를 쓰지 않는 이유: Suspense 경계가 응답을 스트리밍시켜
 * HTTP 상태가 200으로 확정된 뒤 notFound()가 실행되면 soft 404가 된다.
 * 이 컴포넌트는 순수 클라이언트라 서버 응답에 영향을 주지 않는다.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [trackedPathname, setTrackedPathname] = useState(pathname);

  // 경로가 바뀌면 전환이 끝난 것이다. 렌더 중 상태를 조정하는 React 공식 패턴
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)을
  // 쓴다 — useEffect에서 setState를 직접 호출하면 커밋 후 한 번 더 렌더가
  // 발생해 리액트 컴파일러 경고(react-hooks/set-state-in-effect) 대상이 된다.
  if (pathname !== trackedPathname) {
    setTrackedPathname(pathname);
    setIsPending(false);
    setIsVisible(false);
  }

  const { animationDuration, isFinished, progress } = useNProgress({
    isAnimating: isVisible,
  });

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a') ?? null;
      if (shouldStartProgress(event, anchor, window.location.pathname)) {
        // flushSync: 이 클릭 리스너는 document에 등록한 네이티브 이벤트라
        // React 18+ 자동 배칭 대상이다. 그냥 setIsPending(true)로 두면 다음
        // effect(setTimeout 등록)가 같은 브라우저 태스크 안에서 곧바로
        // 실행되지 않아, 클릭 직후 아주 짧은 지연 안에 전환이 끝나는 경우
        // 타이머 등록 자체가 한 박자 밀릴 수 있다. 클릭은 드물게 발생하는
        // 이벤트라 동기 플러시 비용은 무시할 만하다.
        flushSync(() => setIsPending(true));
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () =>
      document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  useEffect(() => {
    if (!isPending) return;

    const showTimer = setTimeout(() => setIsVisible(true), showDelayMs);
    const maxTimer = setTimeout(() => {
      setIsPending(false);
      setIsVisible(false);
    }, maxDurationMs);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(maxTimer);
    };
  }, [isPending]);

  return (
    <div
      data-testid="navigation-progress"
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-100 motion-reduce:transition-none!"
      style={{
        opacity: isFinished ? 0 : 1,
        transition: `opacity ${animationDuration}ms linear`,
      }}
    >
      <div
        className="h-0.5 bg-primary motion-reduce:transition-none!"
        style={{
          marginLeft: `${(-1 + progress) * 100}%`,
          transition: `margin-left ${animationDuration}ms linear`,
        }}
      />
    </div>
  );
}
