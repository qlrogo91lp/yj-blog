'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SITE_NAME } from '@/lib/constants';
import { getBreadcrumb, isEditorPath } from '../_utils/admin-nav';

export function AdminHeaderAction() {
  const pathname = usePathname();
  const isEditor = isEditorPath(pathname);
  const breadcrumb = isEditor ? [] : getBreadcrumb(pathname);

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      {isEditor ? (
        <Link href="/admin" className="text-lg font-semibold">
          {SITE_NAME}
        </Link>
      ) : (
        <>
          <SidebarTrigger />
          <nav
            aria-label="현재 위치"
            className="flex items-center gap-1.5 text-sm"
          >
            {breadcrumb.map((crumb, index) => (
              <span key={crumb} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-muted-foreground">/</span>}
                <span
                  className={
                    index === breadcrumb.length - 1
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </>
      )}

      <div className="ml-auto flex items-center gap-4">
        {!isEditor && (
          <Button size="sm" className="rounded-full" asChild>
            <Link href="/admin/posts/new">
              <Plus size={16} />
              글쓰기
            </Link>
          </Button>
        )}
        <UserButton />
      </div>
    </header>
  );
}
