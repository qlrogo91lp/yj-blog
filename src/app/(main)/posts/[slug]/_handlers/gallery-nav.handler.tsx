'use client';

import { useEffect, type RefObject } from 'react';

type Props = {
  containerRef: RefObject<HTMLElement | null>;
};

/**
 * 본문 HTML은 dangerouslySetInnerHTML로 주입되어 React가 내부에 컴포넌트를 심을 수 없다.
 * 마운트 후 [data-gallery]를 찾아 좌우 버튼을 덧붙이는 점진적 향상으로 처리한다.
 * JS가 없어도 CSS scroll-snap으로 스크롤 자체는 동작한다.
 */
export function GalleryNavHandler({ containerRef }: Props) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const cleanups: (() => void)[] = [];

    root.querySelectorAll<HTMLElement>('[data-gallery]').forEach((gallery) => {
      const wrap = document.createElement('div');
      wrap.setAttribute('data-gallery-wrap', '');
      gallery.parentNode?.insertBefore(wrap, gallery);
      wrap.appendChild(gallery);

      const makeButton = (direction: 'prev' | 'next') => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', direction === 'prev' ? '이전 사진' : '다음 사진');
        button.className = [
          'absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center',
          'rounded-full border bg-background/80 backdrop-blur-sm transition-opacity',
          'hover:bg-background disabled:pointer-events-none',
          direction === 'prev' ? 'left-2' : 'right-2',
        ].join(' ');
        button.innerHTML =
          direction === 'prev'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
        button.addEventListener('click', () => {
          gallery.scrollBy({
            left: direction === 'prev' ? -gallery.clientWidth * 0.8 : gallery.clientWidth * 0.8,
            behavior: 'smooth',
          });
        });
        wrap.appendChild(button);
        return button;
      };

      const prev = makeButton('prev');
      const next = makeButton('next');

      const sync = () => {
        const maxScroll = gallery.scrollWidth - gallery.clientWidth;
        const fits = maxScroll <= 1;
        prev.hidden = fits || gallery.scrollLeft <= 1;
        next.hidden = fits || gallery.scrollLeft >= maxScroll - 1;
      };

      sync();
      gallery.addEventListener('scroll', sync, { passive: true });
      const observer = new ResizeObserver(sync);
      observer.observe(gallery);

      cleanups.push(() => {
        gallery.removeEventListener('scroll', sync);
        observer.disconnect();
        prev.remove();
        next.remove();
        wrap.parentNode?.insertBefore(gallery, wrap);
        wrap.remove();
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [containerRef]);

  return null;
}
