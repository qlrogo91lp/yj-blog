'use client';

import { type MotionValue, motion, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '../../_hooks/useIsMobile';
import { useSectionProgress } from '../../_hooks/useSectionProgress';
import { GolfShot } from '../_components/golf-shot';
import { GolfStatChip } from '../_components/golf-stat-chip';
import {
  type GolfStatChip as GolfStatChipData,
  golfCounterMeta,
  golfHeroSection,
} from '../_utils/golf-counter-content';
import { CHIP_OFFSETS, chipRangeAt, stageRangeOf } from '../_utils/golf-motion';

const CHIP_POSITION = [
  'left-3 top-[27vh] md:left-[9vw] md:top-[34vh]',
  'right-3 top-[33vh] md:right-[8vw] md:top-[30vh]',
  'right-3 bottom-[27vh] md:right-[13vw] md:bottom-[20vh]',
  'left-3 bottom-[30vh] md:left-[11vw] md:bottom-[23vh]',
] as const;

const HEAD_CLASS = 'absolute top-[6vh] right-0 left-0 z-4 px-6 text-center';
const STAGE_LABEL_CLASS =
  'absolute bottom-5 left-6 flex items-center gap-2.5 rounded-full border border-white/14 bg-white/8 px-3.5 py-2 text-[12.5px] font-semibold backdrop-blur-xl';
const CTA_CLASS =
  'absolute right-0 bottom-[5vh] left-0 z-6 flex flex-col flex-wrap items-center justify-center gap-3 px-5 md:bottom-[7vh] md:flex-row';

/**
 * 배지·헤드라인·본문. static/motion 두 래퍼가 같은 내용을 감싸므로 조각으로 뽑았다.
 */
function HeroHeadline() {
  return (
    <>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3.5 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-xl">
        <span className="size-1.75 rounded-full bg-golf-green" />
        {golfHeroSection.badge}
      </div>
      <h1 className="mb-3 text-[clamp(30px,4.8vw,64px)] leading-[0.98] font-bold tracking-[-0.045em] text-balance">
        {golfHeroSection.headingLines[0]}
        <br />
        {golfHeroSection.headingLines[1]}
      </h1>
      <p className="mx-auto max-w-115 text-[17px] leading-[1.45] text-white/55">
        {golfHeroSection.body}
      </p>
    </>
  );
}

function HeroStageLabel() {
  return (
    <>
      <span className="size-1.75 rounded-full bg-golf-orange" />
      {golfHeroSection.stageLabel}
    </>
  );
}

function HeroCta() {
  return (
    <>
      <a
        href={golfCounterMeta.appStoreUrl}
        className="inline-flex rounded-full bg-golf-green px-6.5 py-3.75 text-[15.5px] font-semibold text-black shadow-[0_12px_34px_rgba(52,199,89,0.32)]"
      >
        Download on the App Store
      </a>
      <span className="text-[13.5px] text-white/55">
        {golfCounterMeta.platformNote}
      </span>
    </>
  );
}

type ChipProps = {
  chip: GolfStatChipData;
  index: number;
  progress: MotionValue<number>;
  isMobile: boolean;
  isStatic: boolean;
};

/**
 * 칩 하나. `useTransform`이 칩마다 필요해 자식 컴포넌트로 분리했다 —
 * `.map()` 안에서 훅을 호출하면 rules-of-hooks 위반이다.
 */
function HeroChip({ chip, index, progress, isMobile, isStatic }: ChipProps) {
  const [start, end] = chipRangeAt(index);
  const offsets = isMobile ? CHIP_OFFSETS.mobile : CHIP_OFFSETS.desktop;
  const [dx, dy] = offsets[index];

  const x = useTransform(progress, [start, end], ['0vw', `${dx}vw`]);
  const y = useTransform(progress, [start, end], ['0vh', `${dy}vh`]);
  const scale = useTransform(progress, [start, end], [1, 0.9]);
  const rotate = useTransform(
    progress,
    [start, end],
    [0, (index % 2 ? 1 : -1) * 2.5]
  );
  // 시안 원본: opacity = clamp(1 - max(0, p - 0.66) * 3.4, 0, 1)
  const opacity = useTransform(progress, [0.66, 0.9541], [1, 0]);

  const className = cn('absolute z-5', CHIP_POSITION[index]);

  if (isStatic) {
    return (
      <div className={className}>
        <GolfStatChip chip={chip} />
      </div>
    );
  }

  return (
    <motion.div className={className} style={{ x, y, scale, rotate, opacity }}>
      <GolfStatChip chip={chip} />
    </motion.div>
  );
}

export function HeroArea() {
  const { ref, progress, isStatic } = useSectionProgress();
  const isMobile = useIsMobile();
  const stage = stageRangeOf(isMobile);

  const stageWidth = useTransform(progress, [0, 0.75], stage.width);
  const stageHeight = useTransform(progress, [0, 0.75], stage.height);
  const stageY = useTransform(progress, [0, 0.75], stage.translateY);
  const stageRadius = useTransform(progress, [0, 0.75], stage.borderRadius);

  // 시안 원본: head opacity = clamp(1 - max(0, p - 0.16) * 2.6, 0, 1) → 0.5446에서 0
  const headOpacity = useTransform(progress, [0.16, 0.5446], [1, 0]);
  const headY = useTransform(progress, [0, 0.75], ['0vh', '-9vh']);
  const headScale = useTransform(progress, [0, 0.75], [1, 0.97]);

  // 시안 원본: cta opacity = clamp(1 - max(0, p - 0.12) * 3, 0, 1) → 0.4533에서 0
  const ctaOpacity = useTransform(progress, [0.12, 0.4533], [1, 0]);
  const ctaY = useTransform(progress, [0, 0.75], ['0vh', '6vh']);

  // 시안 원본: stagelabel opacity = clamp((p - 0.45) / 0.2, 0, 1)
  const labelOpacity = useTransform(progress, [0.45, 0.65], [0, 1]);

  const stageClass =
    'relative z-2 grid max-w-205 place-items-center overflow-hidden border border-white/8 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.5)]';

  // 워치 원본이 422×514라 stage를 따라 무한정 키우면 뿌옇게 렌더된다 (설계 5절).
  // max-h로 상한을 걸어 min(stage × 0.84, 44vh) 효과를 낸다.
  const stageShot = (
    <GolfShot
      image={golfHeroSection.shot}
      priority
      sizes="(max-width: 768px) 60vw, 40vw"
      className="max-h-[44vh]"
    />
  );

  return (
    <div
      ref={ref}
      className={cn('relative', isStatic ? 'h-auto' : 'h-[210vh] md:h-[300vh]')}
    >
      <div
        className={
          isStatic
            ? 'flex flex-col items-center gap-10 px-6 py-16'
            : 'sticky top-14 grid h-[calc(100vh-3.5rem)] place-items-center overflow-hidden'
        }
      >
        {/* static 분기는 `motion.*`을 아예 쓰지 않는다. `style`만 undefined로 바꾸면
            첫 렌더에서 framer-motion이 써둔 인라인 스타일(opacity:0 등)이 그대로 남는다. */}
        {isStatic ? (
          <div className="text-center">
            <HeroHeadline />
          </div>
        ) : (
          <motion.div
            className={HEAD_CLASS}
            style={{ opacity: headOpacity, y: headY, scale: headScale }}
          >
            <HeroHeadline />
          </motion.div>
        )}

        {isStatic ? (
          <div
            className={stageClass}
            style={{ width: '86vw', height: '44vh', borderRadius: 32 }}
          >
            {stageShot}
            <div className={STAGE_LABEL_CLASS}>
              <HeroStageLabel />
            </div>
          </div>
        ) : (
          <motion.div
            className={stageClass}
            style={{
              width: stageWidth,
              height: stageHeight,
              y: stageY,
              borderRadius: stageRadius,
            }}
          >
            {stageShot}
            <motion.div
              className={STAGE_LABEL_CLASS}
              style={{ opacity: labelOpacity }}
            >
              <HeroStageLabel />
            </motion.div>
          </motion.div>
        )}

        {golfHeroSection.chips.map((chip, index) => (
          <HeroChip
            key={chip.id}
            chip={chip}
            index={index}
            progress={progress}
            isMobile={isMobile}
            isStatic={isStatic}
          />
        ))}

        {isStatic ? (
          <div className="flex flex-col items-center gap-3">
            <HeroCta />
          </div>
        ) : (
          <motion.div
            className={CTA_CLASS}
            style={{ opacity: ctaOpacity, y: ctaY }}
          >
            <HeroCta />
          </motion.div>
        )}
      </div>
    </div>
  );
}
