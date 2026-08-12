import { Fragment } from 'react';

type Props = {
  items: readonly string[];
};

export function RalliMarquee({ items }: Props) {
  const track = (
    <div className="flex w-1/2 flex-none gap-11 text-[13px] font-semibold tracking-[0.14em] text-ralli-fg/30">
      {items.map((item) => (
        <Fragment key={item}>
          <span>{item}</span>
          <span className="text-ralli-lime">•</span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className="relative z-5 overflow-hidden border-t border-ralli-fg/7 bg-ralli-bg py-4.5"
    >
      <div className="ralli-marquee-track flex w-[200%] whitespace-nowrap">
        {track}
        {track}
      </div>
    </div>
  );
}
