'use client';

import { useState } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSectionProgress } from '../../_hooks/useSectionProgress';
import { stepIndexAt } from '../../_utils/landing-motion';
import { GolfShot } from '../_components/golf-shot';
import { golfHealthSection } from '../_utils/golf-counter-content';

const STEP_COUNT = golfHealthSection.steps.length;

/**
 * 스텝 카드 하나. static/motion 두 분기 모두 같은 마크업이라 조각으로 뽑았다.
 */
function HealthStepCard({
  step,
  isActive,
}: {
  step: (typeof golfHealthSection.steps)[number];
  isActive: boolean;
}) {
  return (
    <div
      data-testid={`golf-step-${step.id}`}
      data-active={isActive}
      className={cn(
        'rounded-[20px] border px-4.5 py-4 transition-all duration-350',
        isActive
          ? 'border-white/20 bg-white/8 opacity-100'
          : 'border-white/10 bg-transparent opacity-45'
      )}
    >
      <div className="mb-1 text-[16.5px] font-semibold tracking-[-0.2px]">
        {step.title}
      </div>
      <div className="text-[14.5px] leading-[1.45] text-white/55">
        {step.body}
      </div>
    </div>
  );
}

/**
 * 크로스페이드 이미지 한 장. static 분기는 `motion.div`를 아예 쓰지 않는다.
 * `animate`만 undefined로 바꾸면 첫 렌더(mounted=false)에서 framer-motion이
 * DOM에 직접 써둔 인라인 스타일(opacity:0 등)이 style diffing을 거치지 않아
 * isStatic이 true로 바뀌어도 지워지지 않는다 (hero.area.tsx와 동일한 이유).
 */
function HealthShot({
  step,
  isActive,
  isStatic,
}: {
  step: (typeof golfHealthSection.steps)[number];
  isActive: boolean;
  isStatic: boolean;
}) {
  const shot = (
    <GolfShot
      image={step.image}
      sizes="(max-width: 768px) 50vw, 30vw"
      className={step.image.kind === 'watch' ? 'max-h-[44vh]' : 'max-h-[70vh]'}
      ariaHidden={!isActive}
    />
  );

  if (isStatic) {
    // 두 이미지가 같은 자리에 absolute로 겹치므로, 비활성 쪽은 `hidden`으로
    // 실제 렌더에서 제외해야 화면에 두 장이 겹쳐 보이는 걸 막을 수 있다.
    return (
      <div
        className={cn(
          'absolute grid place-items-center',
          !isActive && 'hidden'
        )}
      >
        {shot}
      </div>
    );
  }

  return (
    <motion.div
      className="absolute grid place-items-center"
      animate={{
        opacity: isActive ? 1 : 0,
        y: isActive ? 0 : 18,
        scale: isActive ? 1 : 0.96,
      }}
      transition={{ duration: 0.4, ease: [0.2, 0.9, 0.3, 1] }}
    >
      {shot}
    </motion.div>
  );
}

export function HealthArea() {
  const { ref, progress, isStatic } = useSectionProgress();
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(progress, 'change', (value) => {
    setActiveIndex(stepIndexAt(value, STEP_COUNT));
  });

  return (
    <div
      ref={ref}
      id={golfHealthSection.id}
      className={cn('relative', isStatic ? 'h-auto' : 'h-[170vh] md:h-[280vh]')}
    >
      <div
        className={
          isStatic
            ? 'mx-auto grid max-w-325 gap-5 px-5 py-16'
            : 'sticky top-14 mx-auto grid h-[calc(100vh-3.5rem)] max-w-325 grid-cols-1 content-center items-center gap-5 px-5 md:grid-cols-2 md:gap-12 md:px-[max(6vw,28px)]'
        }
      >
        <div>
          <div className="mb-3 text-xs font-bold tracking-[0.18em] text-golf-orange">
            {golfHealthSection.label}
          </div>
          <h2 className="mb-5 text-[clamp(28px,3.8vw,48px)] leading-[1.04] font-bold tracking-[-0.04em] text-pretty">
            {golfHealthSection.heading}
          </h2>
          <div className="flex max-w-115 flex-col gap-2.5">
            {golfHealthSection.steps.map((step, index) => (
              <HealthStepCard
                key={step.id}
                step={step}
                isActive={isStatic || index === activeIndex}
              />
            ))}
          </div>
        </div>

        <div
          className={cn(
            'relative grid h-[38vh] place-items-center overflow-hidden rounded-[28px] border border-white/8 bg-black',
            !isStatic && 'md:h-[74vh] md:rounded-[40px]'
          )}
        >
          {golfHealthSection.steps.map((step, index) => (
            <HealthShot
              key={step.id}
              step={step}
              isActive={index === activeIndex}
              isStatic={isStatic}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
