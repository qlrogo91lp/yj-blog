'use client';

import { type RefObject, useRef } from 'react';
import {
  type MotionValue,
  type UseScrollOptions,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion';
import { useMounted } from './useMounted';

type SectionProgress = {
  ref: RefObject<HTMLDivElement | null>;
  progress: MotionValue<number>;
  isStatic: boolean;
};

/**
 * 섹션 하나의 스크롤 진행도(0~1)를 반환한다.
 * 시안의 `prog(el) = -rect.top / (height - vh)` + 수동 lerp를 대체한다.
 */
export function useSectionProgress(
  offset: UseScrollOptions['offset'] = ['start start', 'end end'],
  smooth = true
): SectionProgress {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
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
