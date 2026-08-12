'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ralliWorkoutSection, type RalliStat } from '../_utils/ralli-content';
import { RalliSectionLabel } from '../_components/ralli-section-label';
import { RalliShot } from '../_components/ralli-shot';
import { Reveal } from '../_actions/reveal.action';

const toneClassName: Record<RalliStat['tone'], string> = {
  lime: 'text-ralli-lime',
  green: 'text-ralli-green',
  fg: 'text-ralli-fg',
};

type StatCardProps = {
  stat: RalliStat;
};

function StatCard({ stat }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      setDisplayed(stat.value);
      return;
    }

    const controls = animate(0, stat.value, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: (value) => setDisplayed(Math.round(value)),
    });

    return () => controls.stop();
  }, [isInView, prefersReducedMotion, stat.value]);

  return (
    <div
      ref={ref}
      className="rounded-[22px] border border-ralli-fg/8 bg-ralli-fg/4 p-6.5"
    >
      <p className="flex items-baseline gap-1">
        <span
          className={cn(
            'text-[52px] font-extrabold tracking-[-0.04em] tabular-nums',
            toneClassName[stat.tone],
          )}
        >
          {displayed}
        </span>
        <span className="text-lg font-semibold text-ralli-fg/50">{stat.unit}</span>
      </p>
      <p className="mt-1.5 text-[14.5px] text-ralli-fg/55">{stat.caption}</p>
    </div>
  );
}

export function WorkoutArea() {
  return (
    <section
      id={ralliWorkoutSection.id}
      className="relative bg-linear-to-b from-ralli-bg via-[#0B1710] to-ralli-bg px-[max(6vw,32px)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-295">
        <Reveal className="mb-14 max-w-160">
          <RalliSectionLabel>{ralliWorkoutSection.label}</RalliSectionLabel>
          <h2 className="mb-3.5 text-[clamp(30px,4vw,54px)] font-bold leading-[1.02] tracking-[-0.04em] text-pretty">
            {ralliWorkoutSection.heading}
          </h2>
          <p className="text-[17px] leading-normal text-ralli-fg/58">{ralliWorkoutSection.body}</p>
        </Reveal>

        <div className="mb-6 grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {ralliWorkoutSection.stats.map((stat, index) => (
            <Reveal key={stat.id} delay={index * 0.08}>
              <StatCard stat={stat} />
            </Reveal>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {ralliWorkoutSection.images.map((image) => (
            <Reveal key={image.src}>
              <div className="grid min-h-75 place-items-center rounded-[26px] border border-ralli-fg/8 bg-ralli-fg/4 p-8 md:min-h-100">
                <RalliShot image={image} className="max-h-85 max-w-full" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
