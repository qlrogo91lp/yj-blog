import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/nav/logo';
import { NavLinks } from '@/components/nav/nav-links';
import { MobileMenu } from '@/components/nav/mobile-menu';
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
          <SignedIn>
            <Link href="/admin" className="mr-1">
              <Button variant="default" size="sm">
                대시보드
              </Button>
            </Link>
          </SignedIn>
          <ThemeToggle />
          <MobileMenu />
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
