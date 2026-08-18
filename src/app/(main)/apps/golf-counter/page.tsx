import type { Metadata } from 'next';
import { CourseArea } from './_areas/course.area';
import { HealthArea } from './_areas/health.area';
import { HeroArea } from './_areas/hero.area';
import { GolfJsonLd } from './_components/golf-json-ld';
import { golfCounterMeta } from './_utils/golf-counter-content';

export const metadata: Metadata = {
  title: `${golfCounterMeta.name} — Golf scores, right on your wrist`,
  description:
    'Count strokes and putts from your Apple Watch, log the round as a HealthKit workout, and review every round on your iPhone.',
};

export default function GolfCounterPage() {
  return (
    <div className="dark relative bg-golf-bg text-golf-fg">
      <GolfJsonLd />
      {/* 메시 그라디언트. 시안은 rAF로 translateY(-scrollY * 0.04) 패럴랙스를 주지만,
          `fixed` 레이어면 같은 "배경이 거의 안 따라온다"는 인상을 JS 0줄로 얻는다.
          스크롤마다 프레임을 도는 구독을 하나 덜기 위한 의도적 단순화다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-1/4 left-1/4 size-[60vw] rounded-full bg-golf-green/12 blur-[120px]" />
        <div className="absolute top-1/2 -right-[16%] size-[50vw] rounded-full bg-golf-orange/8 blur-[140px]" />
      </div>
      <div className="relative z-[1]">
        <HeroArea />
        <CourseArea />
        <HealthArea />
      </div>
    </div>
  );
}
