'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/posts', label: '블로그' },
  { href: '/tags', label: 'Tags' },
  { href: '/apps', label: 'Apps' },
];

type Props = {
  className?: string;
  onLinkClick?: () => void;
  variant?: 'pill' | 'plain';
};

export function NavLinks({ className, onLinkClick, variant = 'pill' }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        variant === 'pill' && 'flex items-center gap-1 rounded-full bg-muted p-1',
        className
      )}
    >
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              variant === 'pill' && isActive
                ? 'bg-background text-foreground font-medium shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              variant === 'plain' && isActive && 'text-foreground font-bold'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
