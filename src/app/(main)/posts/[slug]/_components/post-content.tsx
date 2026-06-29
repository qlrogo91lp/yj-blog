'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type Props = {
  html: string;
};

type ZoomedImage = {
  src: string;
  alt: string;
};

export function PostContent({ html }: Props) {
  const [zoomed, setZoomed] = useState<ZoomedImage | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setZoomed({ src: img.src, alt: img.alt });
    }
  };

  return (
    <>
      <div
        className="prose prose-neutral max-w-none dark:prose-invert [&_img]:cursor-zoom-in"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <Dialog
        open={zoomed !== null}
        onOpenChange={(open) => {
          if (!open) setZoomed(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[95vw] border-0 bg-transparent p-0 shadow-none sm:max-w-[90vw]"
        >
          <DialogTitle className="sr-only">이미지 확대 보기</DialogTitle>
          <DialogDescription className="sr-only">{zoomed?.alt ?? '이미지'}</DialogDescription>
          {zoomed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={zoomed.src}
              alt={zoomed.alt}
              className="mx-auto max-h-[85vh] w-auto rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
