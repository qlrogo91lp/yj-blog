'use client';

import { useState } from 'react';
import {
  type MotionValue,
  motion,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSectionProgress } from '../../_hooks/useSectionProgress';
import { RalliCourtSvg } from '../_components/ralli-court-svg';
import { RalliCtaButton } from '../_components/ralli-cta-button';
import { RalliShot } from '../_components/ralli-shot';
import {
  ralliHeroLetters,
  ralliHeroShot,
  ralliMeta,
} from '../_utils/ralli-content';
import { type RalliScore, scoreAt } from '../_utils/ralli-motion';

const LETTER_DIRECTIONS = [-1.7, -0.85, 0, 0.85, 1.7];
const LETTER_SPREAD_VW = 58;

const letterClassName =
  'text-[min(16.5vw,186px)] font-extrabold leading-[0.8] tracking-[-0.06em]';

type HeroLetterProps = {
  char: string;
  direction: number;
  progress: MotionValue<number>;
  isAccent: boolean;
  isStatic: boolean;
};

function HeroLetter({
  char,
  direction,
  progress,
  isAccent,
  isStatic,
}: HeroLetterProps) {
  const x = useTransform(
    progress,
    [0, 0.84],
    ['0vw', `${direction * LETTER_SPREAD_VW}vw`]
  );
  const y = useTransform(progress, [0, 0.84], ['0vh', '-6vh']);
  const scale = useTransform(progress, [0, 0.84], [1, 1.26]);
  const opacity = useTransform(progress, [0, 0.56], [1, 0]);
  const filter = useTransform(
    progress,
    [0, 0.84],
    ['blur(0px)', 'blur(3.5px)']
  );

  const className = cn(
    letterClassName,
    isAccent ? 'text-ralli-lime' : 'text-ralli-fg'
  );

  if (isStatic) {
    return <span className={className}>{char}</span>;
  }

  return (
    <motion.span style={{ x, y, scale, opacity, filter }} className={className}>
      {char}
    </motion.span>
  );
}

const GLOW_CLASS =
  'absolute size-[120vh] rounded-full bg-[radial-gradient(circle,rgba(200,255,61,0.16)_0%,rgba(52,199,89,0.06)_40%,transparent_68%)] blur-[10px]';
const WATCH_CLASS = 'relative z-3';
const SCORE_CLASS =
  'pointer-events-none absolute right-[max(6vw,32px)] top-[18%] z-4 text-right md:top-1/2';
const COPY_CLASS =
  'absolute bottom-[10vh] left-[max(6vw,32px)] right-[max(6vw,32px)] z-4 max-w-100 md:bottom-[14vh] md:right-auto';

function HeroWatchShot() {
  return (
    <RalliShot
      image={ralliHeroShot}
      priority
      sizes="(max-width: 768px) 44vh, 64vh"
      className="h-[44vh] max-h-140 md:h-[64vh]"
    />
  );
}

function HeroScore({ score }: { score: RalliScore }) {
  return (
    <>
      <p className="mb-1.5 text-xs font-bold tracking-[0.22em] text-ralli-fg/45">
        GAME POINT
      </p>
      <p
        data-testid="ralli-hero-score"
        className={cn(
          'font-extrabold leading-[0.85] tracking-[-0.05em] text-ralli-lime tabular-nums',
          score === 'GAME' ? 'text-[min(7vw,84px)]' : 'text-[min(11vw,132px)]'
        )}
      >
        {score}
      </p>
    </>
  );
}

function HeroCopy() {
  return (
    <>
      <h1 className="mb-3 text-[clamp(26px,3.4vw,44px)] font-bold leading-[1.05] tracking-[-0.035em] text-pretty">
        {ralliMeta.taglineLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </h1>
      <p className="mb-5.5 max-w-85 text-base leading-normal text-ralli-fg/60">
        {ralliMeta.subtitle}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <RalliCtaButton appStoreUrl={ralliMeta.appStoreUrl} />
        <span className="text-[13px] text-ralli-fg/40">
          {ralliMeta.platforms}
        </span>
      </div>
    </>
  );
}

export function HeroArea() {
  const { ref, progress, isStatic } = useSectionProgress([
    'start start',
    'end end',
  ]);
  const [score, setScore] = useState<RalliScore>('0');

  useMotionValueEvent(progress, 'change', (value) => {
    setScore(scoreAt(value));
  });

  const watchScale = useTransform(progress, [0, 0.84], [0.62, 1.2]);
  const watchRotate = useTransform(progress, [0, 0.84], [-4, 0]);
  const watchY = useTransform(progress, [0, 0.84], ['0vh', '-4vh']);
  const watchOpacity = useTransform(progress, [0.84, 1], [1, 0]);

  const courtRotateX = useTransform(progress, [0, 0.84], [56, 36]);
  const courtY = useTransform(progress, [0, 0.84], ['10vh', '-20vh']);
  const courtScale = useTransform(progress, [0, 0.84], [1, 1.5]);
  const courtOpacity = useTransform(progress, [0, 0.84], [0.15, 0.65]);

  const glowScale = useTransform(progress, [0, 0.84], [0.7, 1.6]);

  const copyOpacity = useTransform(
    progress,
    [0.14, 0.36, 0.86, 1],
    [0, 1, 1, 0]
  );
  const copyY = useTransform(progress, [0.14, 0.36], [40, 0]);

  const scoreOpacity = useTransform(
    progress,
    [0.2, 0.4, 0.86, 1],
    [0, 1, 1, 0]
  );
  const hintOpacity = useTransform(progress, [0, 0.17], [1, 0]);

  return (
    <div
      ref={ref}
      className={cn('relative', isStatic ? 'h-auto' : 'h-[180vh] md:h-[280vh]')}
    >
      <div
        className={cn(
          'grid place-items-center overflow-hidden',
          isStatic
            ? 'relative min-h-[80vh] py-24'
            : 'sticky top-14 h-[calc(100vh-3.5rem)]'
        )}
      >
        {isStatic ? (
          <div aria-hidden="true" className={GLOW_CLASS} />
        ) : (
          <motion.div
            aria-hidden="true"
            style={{ scale: glowScale }}
            className={GLOW_CLASS}
          />
        )}

        <motion.div
          aria-hidden="true"
          style={
            isStatic
              ? { opacity: 0.5 }
              : {
                  rotateX: courtRotateX,
                  y: courtY,
                  scale: courtScale,
                  opacity: courtOpacity,
                  transformPerspective: 900,
                }
          }
          className="absolute w-[150%] max-w-400"
        >
          <RalliCourtSvg className="w-full" />
        </motion.div>

        {!isStatic && (
          <div
            data-ralli-wordmark
            aria-hidden="true"
            className="pointer-events-none absolute flex -translate-y-[20vh] items-center gap-[min(2vw,26px)]"
          >
            {ralliHeroLetters.map((char, index) => (
              <HeroLetter
                key={`${char}-${index}`}
                char={char}
                direction={LETTER_DIRECTIONS[index]}
                progress={progress}
                isAccent={index === ralliHeroLetters.length - 1}
                isStatic={isStatic}
              />
            ))}
          </div>
        )}

        {isStatic ? (
          <div className={WATCH_CLASS}>
            <HeroWatchShot />
          </div>
        ) : (
          <motion.div
            style={{
              scale: watchScale,
              rotate: watchRotate,
              y: watchY,
              opacity: watchOpacity,
            }}
            className={WATCH_CLASS}
          >
            <HeroWatchShot />
          </motion.div>
        )}

        {isStatic ? (
          <div className={SCORE_CLASS}>
            <HeroScore score={score} />
          </div>
        ) : (
          <motion.div style={{ opacity: scoreOpacity }} className={SCORE_CLASS}>
            <HeroScore score={score} />
          </motion.div>
        )}

        {isStatic ? (
          <div className={COPY_CLASS}>
            <HeroCopy />
          </div>
        ) : (
          <motion.div
            style={{ opacity: copyOpacity, y: copyY }}
            className={COPY_CLASS}
          >
            <HeroCopy />
          </motion.div>
        )}

        {!isStatic && (
          <motion.div
            aria-hidden="true"
            style={{ opacity: hintOpacity }}
            className="ralli-bob absolute bottom-6.5 left-1/2 z-5 flex -translate-x-1/2 flex-col items-center gap-1.75"
          >
            <span className="text-[10.5px] font-bold tracking-[0.2em] text-ralli-fg/38">
              SCROLL
            </span>
            <span className="h-6.5 w-px bg-linear-to-b from-ralli-lime/90 to-transparent" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
