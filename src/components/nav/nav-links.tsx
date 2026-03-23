import Link from 'next/link';

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
  return (
    <nav className={className}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={onLinkClick}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
