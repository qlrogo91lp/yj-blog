import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { NavLinks } from '@/components/nav/nav-links';
import { MobileMenu } from '@/components/nav/mobile-menu';
import { SITE_NAME } from '@/lib/constants';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-card backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-black text-lg">
            {SITE_NAME}
          </Link>
          <NavLinks className="hidden md:flex items-center gap-4" />
        </div>
        <div className="flex items-center gap-4">
          <MobileMenu />
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/admin">
              <Button variant="default">
                대시보드
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
