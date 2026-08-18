import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GolfImage } from '../_utils/golf-counter-content';

type Props = {
  image: GolfImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** 크로스페이드에서 비활성 이미지를 스크린 리더에서 숨길 때 사용한다. */
  ariaHidden?: boolean;
};

export function GolfShot({ image, className, sizes, priority = false, ariaHidden }: Props) {
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
      aria-hidden={ariaHidden}
      className={cn('w-auto object-contain', className)}
    />
  );
}
