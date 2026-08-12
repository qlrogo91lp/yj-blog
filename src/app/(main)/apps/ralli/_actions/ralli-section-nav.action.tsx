'use client';

import { ralliMeta, ralliNavLinks } from '../_utils/ralli-content';

export function RalliSectionNavAction() {
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

      <div className="fixed inset-x-0 bottom-0 z-60 border-t border-ralli-fg/10 bg-[rgba(7,16,11,0.88)] px-4 py-3 backdrop-blur-xl md:hidden">
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
