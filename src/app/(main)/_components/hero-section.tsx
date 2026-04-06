import Link from 'next/link';
import { PROFILE } from '../_constants/profile';

export function HeroSection() {
  return (
    <section className="py-20 text-center">
      <h1 className="mb-3 text-4xl font-black tracking-tight">{PROFILE.name}</h1>
      <p className="mb-2 text-lg font-medium text-foreground">{PROFILE.headline}</p>
      <p className="mb-8 text-sm text-muted-foreground">{PROFILE.description}</p>
      <Link
        href={PROFILE.ctaHref}
        className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
      >
        {PROFILE.ctaLabel}
      </Link>
    </section>
  );
}
