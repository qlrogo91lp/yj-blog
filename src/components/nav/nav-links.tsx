'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Home' },
  { href: '/posts', label: '블로그' },
  { href: '/tags', label: 'Tags' },
  { href: '/apps', label: 'Apps' },
];

function isLinkActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

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
        const isActive = isLinkActive(pathname, link.href);

        if (variant === 'plain') {
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'text-foreground font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
            className={cn(
              'relative rounded-full px-3 py-1.5 text-sm transition-colors',
              isActive
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-full bg-background shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
