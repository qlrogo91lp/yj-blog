import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} YJ Blog. All rights reserved.
      </div>
    </footer>
  );
}
