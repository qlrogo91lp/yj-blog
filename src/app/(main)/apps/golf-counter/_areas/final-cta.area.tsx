import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '../../_actions/reveal.action';
import { golfCounterMeta, golfFinalCta } from '../_utils/golf-counter-content';

export function FinalCtaArea() {
  return (
    <section className="px-5 pb-14 md:px-[max(6vw,28px)]">
      <Reveal className="mx-auto max-w-280">
        <div className="rounded-[40px] border border-white/10 bg-white/6 px-8 py-16 text-center backdrop-blur-3xl">
          <Image
            src={golfCounterMeta.iconSrc}
            alt={`${golfCounterMeta.name} app icon`}
            width={84}
            height={84}
            className="mx-auto mb-5 rounded-[21px] shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
          />
          <h2 className="mb-3 text-[clamp(28px,4vw,52px)] leading-none font-bold tracking-[-0.045em]">
            {golfFinalCta.heading}
          </h2>
          <p className="mb-6.5 text-[16.5px] text-white/55">{golfFinalCta.body}</p>
          <a
            href={golfCounterMeta.appStoreUrl}
            className="inline-flex rounded-full bg-golf-green px-7.5 py-4 text-base font-semibold text-black shadow-[0_14px_40px_rgba(52,199,89,0.3)]"
          >
            Download on the App Store
          </a>
          <div className="mt-10 flex justify-center gap-5 text-[13.5px] text-white/45">
            <Link href="/apps/golf-counter/privacy">Privacy Policy</Link>
            <a href={`mailto:${golfCounterMeta.supportEmail}`}>Support</a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
