import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SITE_NAME } from '@/lib/constants';
import { ralliMeta, ralliFeatures, ralliScreenshots } from './_utils/ralli-content';
import { RalliHero } from './_components/ralli-hero';
import { RalliFeatureSection } from './_components/ralli-feature-section';
import { RalliScreenshotGallery } from './_components/ralli-screenshot-gallery';
import { RalliSupport } from './_components/ralli-support';
import { RalliJsonLd } from './_components/ralli-json-ld';

const ralliDescription =
  'Ralli — a wrist-first tennis score & workout companion for Apple Watch and iPhone.';

export const metadata: Metadata = {
  title: `${ralliMeta.name} — Tennis Score | ${SITE_NAME}`,
  description: ralliDescription,
  alternates: {
    canonical: '/apps/ralli',
  },
  openGraph: {
    title: `${ralliMeta.name} — Tennis Score`,
    description: ralliDescription,
    url: '/apps/ralli',
    type: 'website',
    images: [{ url: ralliMeta.iconSrc, width: 1024, height: 1024, alt: `${ralliMeta.name} app icon` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${ralliMeta.name} — Tennis Score`,
    description: ralliDescription,
    images: [ralliMeta.iconSrc],
  },
};

export default function RalliPage() {
  return (
    <div className="bg-black text-white">
      <RalliJsonLd />
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <Link
          href="/apps"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Apps
        </Link>
      </div>

      <RalliHero
        name={ralliMeta.name}
        tagline={ralliMeta.tagline}
        subtitle={ralliMeta.subtitle}
        iconSrc={ralliMeta.iconSrc}
        appStoreUrl={ralliMeta.appStoreUrl}
      />

      {ralliFeatures.map((feature, index) => (
        <RalliFeatureSection key={feature.id} feature={feature} index={index} />
      ))}

      <RalliScreenshotGallery screenshots={ralliScreenshots} />

      <RalliSupport email={ralliMeta.supportEmail} />

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {ralliMeta.name}
      </footer>
    </div>
  );
}
