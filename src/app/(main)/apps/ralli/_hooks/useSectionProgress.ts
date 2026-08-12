'use client';

import { useRef, useSyncExternalStore, type RefObject } from 'react';
import {
  useReducedMotion,
  useScroll,
  useSpring,
  type MotionValue,
  type UseScrollOptions,
} from 'framer-motion';

type SectionProgress = {
  ref: RefObject<HTMLDivElement | null>;
  progress: MotionValue<number>;
  isStatic: boolean;
};

function subscribe() {
  return () => {};
}

/**
 * 섹션 하나의 스크롤 진행도(0~1)를 반환한다.
 * 시안의 `prog(el) = -rect.top / (height - vh)` + 수동 lerp를 대체한다.
 */
export function useSectionProgress(
  offset: UseScrollOptions['offset'] = ['start start', 'end end'],
  smooth = true,
): SectionProgress {
  const ref = useRef<HTMLDivElement>(null);
  // 서버/클라이언트 첫 렌더는 항상 애니메이션 경로(isStatic=false)로 맞춰 hydration mismatch를 막는다.
  // 마운트 후에만 실제 prefersReducedMotion 값을 반영한다.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 22,
    restDelta: 0.0005,
  });

  return {
    ref,
    progress: smooth ? smoothed : scrollYProgress,
    isStatic: Boolean(prefersReducedMotion) && mounted,
  };
}
