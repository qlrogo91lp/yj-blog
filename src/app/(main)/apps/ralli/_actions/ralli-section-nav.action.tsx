'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ralliMeta, ralliNavLinks } from '../_utils/ralli-content';

export function RalliSectionNavAction() {
  // 모바일 고정 바는 fixed라서 페이지 하단 padding만으로는 공용 Footer를 가리는 문제가 해결되지 않는다
  // (Footer는 이 div의 조상 밖 형제 요소라 padding-bottom이 Footer 뒤 공간을 만들지 못한다).
  // Footer가 뷰포트에 들어오면 바를 페이드아웃해 가리지 않도록 한다.
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const observer = new IntersectionObserver(([entry]) => {
      setFooterVisible(entry.isIntersecting);
    });
    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav
        aria-label="Ralli 섹션"
        className="fixed left-1/2 top-17.5 z-60 hidden -translate-x-1/2 items-center gap-4.5 rounded-full border border-ralli-fg/10 bg-[rgba(16,26,19,0.62)] py-2.25 pl-4.5 pr-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-3xl backdrop-saturate-150 md:flex"
      >
        <ul className="flex gap-4 text-[13px] font-medium text-ralli-fg/62">
          {ralliNavLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-ralli-fg">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={ralliMeta.appStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-ralli-lime px-4 py-2 text-[13px] font-bold tracking-[-0.2px] text-ralli-bg transition-colors hover:bg-ralli-lime/85"
        >
          Get Ralli
        </a>
      </nav>

      <div
        data-testid="ralli-mobile-cta-bar"
        className={cn(
          'fixed inset-x-0 bottom-0 z-60 border-t border-ralli-fg/10 bg-[rgba(7,16,11,0.88)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl transition-opacity duration-200 md:hidden',
          footerVisible && 'pointer-events-none opacity-0',
        )}
      >
        <a
          href={ralliMeta.appStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-full bg-ralli-lime px-6 py-3.5 text-sm font-bold text-ralli-bg"
        >
          Download on the App Store
        </a>
      </div>
    </>
  );
}
