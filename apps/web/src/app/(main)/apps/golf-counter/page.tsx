import type { Metadata } from 'next';
import { AfterRoundArea } from './_areas/after-round.area';
import { CourseArea } from './_areas/course.area';
import { FinalCtaArea } from './_areas/final-cta.area';
import { HealthArea } from './_areas/health.area';
import { HeroArea } from './_areas/hero.area';
import { HolesArea } from './_areas/holes.area';
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
        <AfterRoundArea />
        <HolesArea />
        <FinalCtaArea />
      </div>
    </div>
  );
}
