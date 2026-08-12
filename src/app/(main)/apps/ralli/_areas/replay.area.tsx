'use client';

import { motion, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSectionProgress } from '../_hooks/useSectionProgress';
import { useIsMobile } from '../_hooks/useIsMobile';
import { ralliReplaySection } from '../_utils/ralli-content';
import { RalliSectionLabel } from '../_components/ralli-section-label';
import { RalliShot } from '../_components/ralli-shot';
import { Reveal } from '../_actions/reveal.action';

/** 데스크톱 드리프트 이동 거리. 갤러리 전체 폭에서 뷰포트를 뺀 만큼 왼쪽으로 민다. */
const DRIFT_VW = -55;

export function ReplayArea() {
  const { ref, progress, isStatic } = useSectionProgress(['start end', 'end start'], false);
  const isMobile = useIsMobile();
  const driftX = useTransform(progress, [0, 1], ['0vw', `${DRIFT_VW}vw`]);

  const useNativeScroll = isMobile || isStatic;

  return (
    <section
      id={ralliReplaySection.id}
      ref={ref}
      className="relative overflow-hidden bg-ralli-bg py-24 md:py-28"
    >
      <Reveal className="mx-auto mb-13 max-w-295 px-[max(6vw,32px)]">
        <RalliSectionLabel>{ralliReplaySection.label}</RalliSectionLabel>
        <h2 className="max-w-155 text-[clamp(30px,4vw,54px)] font-bold leading-[1.02] tracking-[-0.04em] text-pretty">
          {ralliReplaySection.heading}
        </h2>
      </Reveal>

      <div
        className={cn(
          useNativeScroll && 'snap-x snap-mandatory overflow-x-auto pb-4',
        )}
      >
        <motion.div
          style={useNativeScroll ? undefined : { x: driftX }}
          className="flex gap-5.5 px-[max(6vw,32px)]"
        >
          {ralliReplaySection.gallery.map((image) => (
            <div key={image.src} className="flex-none snap-center">
              <RalliShot
                image={image}
                sizes="(max-width: 768px) 55vw, 22vw"
                className="h-95 md:h-130"
              />
            </div>
          ))}
        </motion.div>
      </div>

      <div className="mx-auto mt-13 grid max-w-295 grid-cols-1 gap-9 px-[max(6vw,32px)] md:grid-cols-3">
        {ralliReplaySection.notes.map((note, index) => (
          <Reveal key={note.id} delay={index * 0.08}>
            <p className="mb-1.25 text-[16.5px] font-semibold">{note.title}</p>
            <p className="text-[14.5px] leading-[1.45] text-ralli-fg/55">{note.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
