'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

function subscribe() {
  return () => {};
}

/** 시안의 `[data-reveal]` 매 프레임 계산을 IntersectionObserver 1회 발화로 대체한다. */
export function Reveal({ children, className, delay = 0 }: Props) {
  // 서버/클라이언트 첫 렌더는 항상 애니메이션 경로로 맞춰 hydration mismatch를 막는다.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const prefersReducedMotion = useReducedMotion();

  const isStatic = Boolean(prefersReducedMotion) && mounted;

  if (isStatic) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 46 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
