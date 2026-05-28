import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RalliFeature } from '../_utils/ralli-content';

type Props = {
  feature: RalliFeature;
  index: number;
};

export function RalliFeatureSection({ feature, index }: Props) {
  const isReversed = index % 2 === 1;

  return (
    <section className="border-t border-white/10 py-16">
      <div
        className={cn(
          'mx-auto flex max-w-4xl flex-col items-center gap-10 px-4 md:flex-row',
          isReversed && 'md:flex-row-reverse',
        )}
      >
        <div className="flex-1">
          <h2 className="text-2xl font-bold sm:text-3xl">{feature.heading}</h2>
          <ul className="mt-6 space-y-3">
            {feature.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-white/70">
                <Check size={18} className="mt-1 shrink-0 text-lime-400" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-1 items-end justify-center gap-4">
          {feature.images.map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              className={cn(
                'w-auto rounded-2xl object-contain',
                img.kind === 'ios' ? 'max-h-70' : 'max-h-50',
              )}
              sizes="(max-width: 768px) 45vw, 200px"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
