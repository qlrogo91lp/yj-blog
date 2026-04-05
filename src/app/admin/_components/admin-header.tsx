'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AdminHeader() {
  const pathname = usePathname();
  const isEditing =
    pathname === '/admin/posts/new' || pathname.includes('/admin/posts/') && pathname.endsWith('/edit');

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <div className="ml-auto flex items-center gap-4">
        {!isEditing && (
          <Button size="sm" asChild>
            <Link href="/admin/posts/new">글쓰기</Link>
          </Button>
        )}
        <UserButton />
      </div>
    </header>
  );
}
