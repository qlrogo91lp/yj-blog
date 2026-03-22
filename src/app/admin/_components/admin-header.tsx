'use client';

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AdminHeader() {
  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" asChild>
          <Link href="/admin/posts/new">글쓰기</Link>
        </Button>
        <UserButton />
      </div>
    </header>
  );
}
