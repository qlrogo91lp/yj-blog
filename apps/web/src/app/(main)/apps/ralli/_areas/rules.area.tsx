'use client';

import { cn } from '@/lib/utils';
import { Reveal } from '../../_actions/reveal.action';
import { RalliSectionLabel } from '../_components/ralli-section-label';
import { RalliShot } from '../_components/ralli-shot';
import { ralliRulesSection } from '../_utils/ralli-content';

export function RulesArea() {
  return (
    <section
      id={ralliRulesSection.id}
      className="bg-ralli-bg px-[max(6vw,32px)] pb-24 md:pb-32"
    >
      <div className="mx-auto grid max-w-295 grid-cols-1 items-center gap-12 rounded-[34px] border border-ralli-fg/9 bg-linear-150 from-ralli-lime/9 via-ralli-green/5 to-transparent p-7 md:grid-cols-2 md:p-14">
        <Reveal>
          <RalliSectionLabel>{ralliRulesSection.label}</RalliSectionLabel>
          <h2 className="mb-4 text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.05] tracking-[-0.04em] text-pretty">
            {ralliRulesSection.heading}
          </h2>
          <p className="mb-6.5 max-w-100 text-[16.5px] leading-normal text-ralli-fg/58">
            {ralliRulesSection.body}
          </p>
          <ul className="flex flex-wrap gap-2.25">
            {ralliRulesSection.chips.map((chip, index) => (
              <li
                key={chip}
                className={cn(
                  'rounded-full px-4 py-2.25 text-[13.5px]',
                  index === 0
                    ? 'bg-ralli-lime font-bold text-ralli-bg'
                    : 'border border-ralli-fg/10 bg-ralli-fg/7 font-semibold'
                )}
              >
                {chip}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="flex items-center justify-center gap-5">
          {ralliRulesSection.images.map((image) => (
            <RalliShot
              key={image.src}
              image={image}
              className={
                image.kind === 'watch' ? 'h-60 md:h-85' : 'h-70 md:h-100'
              }
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
