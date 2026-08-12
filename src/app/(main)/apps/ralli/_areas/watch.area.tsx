'use client';

import { useState } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSectionProgress } from '../_hooks/useSectionProgress';
import { stepIndexAt } from '../_utils/ralli-motion';
import { ralliWatchSection } from '../_utils/ralli-content';
import { RalliSectionLabel } from '../_components/ralli-section-label';
import { RalliShot } from '../_components/ralli-shot';

export function WatchArea() {
  const { ref, progress, isStatic } = useSectionProgress(['start start', 'end end']);
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(progress, 'change', (value) => {
    setActiveIndex(stepIndexAt(value, ralliWatchSection.steps.length));
  });

  return (
    <section
      id={ralliWatchSection.id}
      ref={ref}
      className={cn('relative bg-ralli-bg', isStatic ? 'h-auto py-24' : 'h-[240vh] md:h-[300vh]')}
    >
      <div
        className={cn(
          'grid items-center gap-10 px-[max(6vw,32px)]',
          isStatic
            ? 'relative grid-cols-1 md:grid-cols-2'
            : 'sticky top-14 h-[calc(100vh-3.5rem)] grid-cols-1 md:grid-cols-2',
        )}
      >
        <div className="max-w-120">
          <RalliSectionLabel>{ralliWatchSection.label}</RalliSectionLabel>
          <h2 className="mb-7.5 text-[clamp(30px,4vw,54px)] font-bold leading-[1.02] tracking-[-0.04em] text-pretty">
            {ralliWatchSection.heading}
          </h2>
          <ul className="flex flex-col gap-0.5">
            {ralliWatchSection.steps.map((step, index) => {
              const isActive = isStatic || index === activeIndex;
              return (
                <li
                  key={step.id}
                  data-testid={`ralli-step-${step.id}`}
                  data-active={isActive}
                  className={cn(
                    'rounded-2xl border px-4.5 py-4 transition-all duration-350',
                    isActive
                      ? 'border-ralli-lime/35 bg-ralli-lime/10 opacity-100'
                      : 'border-ralli-fg/8 bg-transparent opacity-40',
                  )}
                >
                  <p className="mb-1 text-[17px] font-semibold tracking-[-0.2px]">{step.title}</p>
                  <p className="text-[14.5px] leading-[1.45] text-ralli-fg/55">{step.body}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative grid h-[42vh] place-items-center md:h-[78vh]">
          <div
            aria-hidden="true"
            className="absolute aspect-square w-[78%] rounded-full bg-[radial-gradient(circle,rgba(52,199,89,0.16),transparent_66%)]"
          />
          {ralliWatchSection.steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="absolute"
              animate={{
                opacity: isStatic ? (index === 0 ? 1 : 0) : index === activeIndex ? 1 : 0,
                scale: index === activeIndex ? 1 : 0.94,
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <RalliShot image={step.image} className="max-h-[38vh] md:max-h-[58vh]" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
