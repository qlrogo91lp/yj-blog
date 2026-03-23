'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLinks } from '@/components/nav/nav-links';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
      {isOpen && (
        <div className="absolute left-0 right-0 top-14 border-b bg-background px-4 py-3">
          <NavLinks
            className="flex flex-col gap-3"
            onLinkClick={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
