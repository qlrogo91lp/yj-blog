import Image from 'next/image';
import type { RalliImage } from '../_utils/ralli-content';

type Props = {
  screenshots: RalliImage[];
};

export function RalliScreenshotGallery({ screenshots }: Props) {
  const iosShots = screenshots.filter((s) => s.kind === 'ios');
  const watchShots = screenshots.filter((s) => s.kind === 'watch');

  return (
    <section className="border-t border-white/10 py-16">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">See it in action</h2>

        <h3 className="mt-10 text-sm font-semibold uppercase tracking-wide text-white/50">
          iPhone
        </h3>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
          {iosShots.map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              className="h-auto w-45 shrink-0 rounded-2xl"
              sizes="180px"
            />
          ))}
        </div>

        <h3 className="mt-10 text-sm font-semibold uppercase tracking-wide text-white/50">
          Apple Watch
        </h3>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
          {watchShots.map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              className="h-auto w-40 shrink-0 rounded-2xl"
              sizes="160px"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
