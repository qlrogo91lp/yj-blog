import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLinks } from '@/components/nav/nav-links';
import { MobileMenu } from '@/components/nav/mobile-menu';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-lg">
            YJ Blog
          </Link>
          <NavLinks className="hidden md:flex items-center gap-4" />
        </div>
        <div className="flex items-center gap-1">
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
