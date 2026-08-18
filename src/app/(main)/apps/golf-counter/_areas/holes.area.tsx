import { cn } from '@/lib/utils';
import { Reveal } from '../../_actions/reveal.action';
import { GolfShot } from '../_components/golf-shot';
import { golfHolesSection } from '../_utils/golf-counter-content';

export function HolesArea() {
  return (
    <section className="px-5 pb-16 md:px-[max(6vw,28px)] md:pb-28">
      <div className="mx-auto max-w-280">
        <Reveal>
          <div className="grid items-center gap-6 rounded-[34px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl md:grid-cols-2 md:gap-10 md:p-9">
            <div>
              <h3 className="mb-2.5 text-[clamp(22px,2.6vw,32px)] leading-[1.1] font-bold tracking-[-0.03em]">
                {golfHolesSection.heading}
              </h3>
              <p className="mb-5 max-w-95 text-[15.5px] leading-[1.5] text-white/55">
                {golfHolesSection.body}
              </p>
              <div className="flex flex-wrap gap-2">
                {golfHolesSection.chips.map((chip) => (
                  <span
                    key={chip.label}
                    data-active={chip.isActive}
                    className={cn(
                      'rounded-full px-3.75 py-2 text-[13px] font-semibold',
                      chip.isActive ? 'bg-golf-green text-black' : 'bg-white/10 text-white/70',
                    )}
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid min-h-70 place-items-center rounded-[26px] border border-white/8 bg-black p-5.5">
              <GolfShot
                image={golfHolesSection.image}
                sizes="(max-width: 768px) 50vw, 24vw"
                className="max-h-50"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
