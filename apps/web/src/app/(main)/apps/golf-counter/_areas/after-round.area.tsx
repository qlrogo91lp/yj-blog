import { Reveal } from '../../_actions/reveal.action';
import { GolfShot } from '../_components/golf-shot';
import { golfAfterSection } from '../_utils/golf-counter-content';

export function AfterRoundArea() {
  return (
    <section
      id={golfAfterSection.id}
      className="px-5 py-16 md:px-[max(6vw,28px)] md:pb-28"
    >
      <div className="mx-auto max-w-280">
        <Reveal className="mb-10 max-w-150">
          <div className="mb-3 text-xs font-bold tracking-[0.18em] text-golf-green">
            {golfAfterSection.label}
          </div>
          <h2 className="mb-3 text-[clamp(28px,3.8vw,48px)] leading-[1.04] font-bold tracking-[-0.04em] text-pretty">
            {golfAfterSection.heading}
          </h2>
          <p className="text-[17px] leading-[1.5] text-white/55">
            {golfAfterSection.body}
          </p>
        </Reveal>

        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {golfAfterSection.gallery.map((image, index) => (
            <Reveal key={image.src} delay={index * 0.08}>
              <div className="grid min-h-105 place-items-center rounded-[34px] border border-white/8 bg-black p-7">
                <GolfShot
                  image={image}
                  sizes="(max-width: 768px) 70vw, 34vw"
                  className="max-h-85"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
