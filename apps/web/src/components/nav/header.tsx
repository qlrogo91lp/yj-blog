import Link from 'next/link';
import { ContentContainer } from '@/components/layout/content-container';
import {
  HeaderAdminLink,
  HeaderAuthButtons,
} from '@/components/nav/header-auth';
import { Logo } from '@/components/nav/logo';
import { MobileMenu } from '@/components/nav/mobile-menu';
import { NavLinks } from '@/components/nav/nav-links';
import { ThemeToggle } from '@/components/theme-toggle';
import { SITE_NAME } from '@/lib/constants';

export function Header() {
  return (
    <header className="dark sticky top-0 z-50 border-b border-white/10 bg-black/80 text-white backdrop-blur-xl backdrop-saturate-150">
      <ContentContainer className="flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-black">
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
      </ContentContainer>
    </header>
  );
}
