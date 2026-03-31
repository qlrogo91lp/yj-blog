'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: '블로그' },
  { href: '/apps', label: 'Apps' },
  { href: '/playground', label: '플레이그라운드' },
];

type Props = {
  className?: string;
  onLinkClick?: () => void;
};

export function NavLinks({ className, onLinkClick }: Props) {
  const pathname = usePathname();

  return (
    <nav className={className}>
      {links.map((link) => {
        const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm transition-colors ${isActive ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={onLinkClick}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
