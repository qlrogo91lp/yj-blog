import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { RalliImage } from '../_utils/ralli-content';

type Props = {
  image: RalliImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function RalliShot({ image, className, sizes, priority = false }: Props) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes ?? (image.kind === 'watch' ? '(max-width: 768px) 40vw, 26vw' : '(max-width: 768px) 60vw, 30vw')}
      priority={priority}
      className={cn('ralli-shot-mask w-auto object-contain', className)}
    />
  );
}
