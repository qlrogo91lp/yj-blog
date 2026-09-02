'use client';

import { useSyncExternalStore } from 'react';

function subscribe() {
  return () => {};
}

/**
 * hydration이 끝났는지 여부.
 *
 * `prefers-reduced-motion` 같은 클라이언트 전용 값으로 **DOM 구조**를 바꾸면
 * 서버 렌더 결과와 클라이언트 첫 렌더가 달라져 hydration mismatch가 난다.
 * 서버·hydration 시점에는 항상 false를 반환해 양쪽을 일치시키고,
 * 마운트 후에만 true가 되어 실제 분기를 허용한다.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
