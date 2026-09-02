'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '../../_actions/reveal.action';
import { RalliCtaButton } from '../_components/ralli-cta-button';
import { ralliFinalCta, ralliMeta } from '../_utils/ralli-content';

export function FinalCtaArea() {
  return (
    <section className="bg-ralli-bg px-[max(6vw,32px)] pb-24 md:pb-15">
      <Reveal className="mx-auto max-w-295 border-t border-ralli-fg/8 py-14 text-center md:py-17">
        <Image
          src={ralliMeta.iconSrc}
          alt={`${ralliMeta.name} app icon`}
          width={88}
          height={88}
          className="mx-auto mb-5.5 rounded-[22px]"
        />
        <h2 className="mb-3.5 text-[clamp(30px,4.4vw,58px)] font-extrabold leading-none tracking-[-0.045em]">
          {ralliFinalCta.heading}
        </h2>
        <p className="mb-7 text-[16.5px] text-ralli-fg/55">
          {ralliFinalCta.body}
        </p>
        <RalliCtaButton appStoreUrl={ralliMeta.appStoreUrl} />
        <div className="mt-11 flex justify-center gap-5.5 text-[13.5px] text-ralli-fg/42">
          <Link
            href="/apps/ralli/privacy"
            className="transition-colors hover:text-ralli-fg"
          >
            Privacy Policy
          </Link>
          <a
            href={`mailto:${ralliMeta.supportEmail}`}
            className="transition-colors hover:text-ralli-fg"
          >
            Support
          </a>
        </div>
      </Reveal>
    </section>
  );
}
