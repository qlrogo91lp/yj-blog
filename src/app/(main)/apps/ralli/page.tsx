import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { ralliMarqueeItems, ralliMeta } from './_utils/ralli-content';
import { RalliJsonLd } from './_components/ralli-json-ld';
import { RalliMarquee } from './_components/ralli-marquee';
import { RalliSectionNavAction } from './_actions/ralli-section-nav.action';
import { HeroArea } from './_areas/hero.area';
import { WatchArea } from './_areas/watch.area';
import { WorkoutArea } from './_areas/workout.area';
import { ReplayArea } from './_areas/replay.area';
import { RulesArea } from './_areas/rules.area';
import { FinalCtaArea } from './_areas/final-cta.area';

export const metadata: Metadata = {
  title: `${ralliMeta.name} — Tennis Score | ${SITE_NAME}`,
  description: ralliMeta.subtitle,
  alternates: {
    canonical: '/apps/ralli',
  },
  openGraph: {
    title: `${ralliMeta.name} — Tennis Score`,
    description: ralliMeta.subtitle,
    url: '/apps/ralli',
    type: 'website',
    images: [
      { url: ralliMeta.iconSrc, width: 1024, height: 1024, alt: `${ralliMeta.name} app icon` },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${ralliMeta.name} — Tennis Score`,
    description: ralliMeta.subtitle,
    images: [ralliMeta.iconSrc],
  },
};

export default function RalliPage() {
  return (
    <div className="dark relative overflow-x-clip bg-ralli-bg pb-20 text-ralli-fg md:pb-0">
      <RalliJsonLd />
      <RalliSectionNavAction />

      <HeroArea />
      <RalliMarquee items={ralliMarqueeItems} />
      <WatchArea />
      <WorkoutArea />
      <ReplayArea />
      <RulesArea />
      <FinalCtaArea />
    </div>
  );
}
