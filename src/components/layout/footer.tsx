import { SITE_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="mt-auto bg-card">
      <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
