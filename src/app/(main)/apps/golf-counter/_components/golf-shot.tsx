import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GolfImage } from '../_utils/golf-counter-content';

type Props = {
  image: GolfImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function GolfShot({ image, className, sizes, priority = false }: Props) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={
        sizes ??
        (image.kind === 'watch'
          ? '(max-width: 768px) 40vw, 26vw'
          : '(max-width: 768px) 60vw, 30vw')
      }
      priority={priority}
      className={cn('w-auto object-contain', className)}
    />
  );
}
