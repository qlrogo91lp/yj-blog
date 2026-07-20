import Link from 'next/link';
import { Logo } from '@/components/nav/logo';
import { NavLinks } from '@/components/nav/nav-links';
import { MobileMenu } from '@/components/nav/mobile-menu';
import { HeaderAdminLink, HeaderAuthButtons } from '@/components/nav/header-auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { SITE_NAME } from '@/lib/constants';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-black text-lg">
          <Logo />
          {SITE_NAME}
        </Link>

        <div className="flex items-center gap-2">
          <NavLinks className="hidden md:flex" />
          <HeaderAdminLink />
          <ThemeToggle />
          <MobileMenu />
          <HeaderAuthButtons />
        </div>
      </div>
    </header>
  );
}
