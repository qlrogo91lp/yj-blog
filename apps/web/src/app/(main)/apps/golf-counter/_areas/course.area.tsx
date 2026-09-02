import { Reveal } from '../../_actions/reveal.action';
import { GolfShot } from '../_components/golf-shot';
import { golfCourseSection } from '../_utils/golf-counter-content';

export function CourseArea() {
  const [tall, ...rest] = golfCourseSection.cards;

  return (
    <section
      id={golfCourseSection.id}
      className="px-5 py-16 md:px-[max(6vw,28px)] md:py-28"
    >
      <div className="mx-auto max-w-280">
        <Reveal className="mb-11 max-w-150">
          <div className="mb-3 text-xs font-bold tracking-[0.18em] text-golf-green">
            {golfCourseSection.label}
          </div>
          <h2 className="mb-3 text-[clamp(28px,3.8vw,48px)] leading-[1.04] font-bold tracking-[-0.04em] text-pretty">
            {golfCourseSection.heading}
          </h2>
          <p className="text-[17px] leading-[1.5] text-white/55">
            {golfCourseSection.body}
          </p>
        </Reveal>

        <div className="grid gap-3 md:grid-cols-[1.25fr_1fr] md:gap-4">
          <Reveal className="md:row-span-2">
            <div className="relative grid h-full min-h-100 place-items-center overflow-hidden rounded-[34px] border border-white/8 bg-black p-9 md:min-h-130">
              <GolfShot
                image={tall.image}
                sizes="(max-width: 768px) 70vw, 34vw"
                className="max-h-100"
              />
              <div className="absolute bottom-7 left-7.5">
                <div className="mb-1 text-[19px] font-semibold tracking-[-0.3px]">
                  {tall.title}
                </div>
                <div className="max-w-70 text-[14.5px] text-white/55">
                  {tall.body}
                </div>
              </div>
            </div>
          </Reveal>

          {rest.map((card, index) => (
            <Reveal key={card.id} delay={(index + 1) * 0.08}>
              <div className="flex min-h-63 flex-col justify-between rounded-[34px] border border-white/10 bg-white/6 p-7.5 backdrop-blur-2xl">
                <div className="text-[19px] font-semibold tracking-[-0.3px]">
                  {card.title}
                </div>
                <p className="mt-2 mb-4.5 text-[14.5px] leading-[1.45] text-white/55">
                  {card.body}
                </p>
                <div className="grid flex-1 place-items-center overflow-hidden rounded-[22px] border border-white/8 bg-black p-3.5">
                  <GolfShot
                    image={card.image}
                    sizes="(max-width: 768px) 40vw, 20vw"
                    className="max-h-37.5"
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
