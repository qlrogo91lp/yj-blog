'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/nav/logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { SITE_NAME } from '@/lib/constants';
import {
  type AdminNavItem,
  adminFooterItems,
  adminNavGroups,
  getActiveNavHref,
} from '../_utils/admin-nav';

type Props = {
  /** 답변 대기 댓글 수. admin/layout.tsx가 주입한다. */
  pendingReplyCount?: number;
};

export function AdminSidebarAction({ pendingReplyCount }: Props) {
  const pathname = usePathname();
  const activeHref = getActiveNavHref(pathname);

  function renderItem(item: AdminNavItem, badge?: number) {
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={item.href === activeHref}
          className="h-10 rounded-full px-3 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <Link href={item.href}>
            <item.icon size={16} />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
        {badge !== undefined && badge > 0 && (
          <SidebarMenuBadge className="bg-sidebar-accent text-sidebar-accent-foreground rounded-full peer-data-[size=default]/menu-button:top-2.5">
            {badge}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader className="h-14 justify-center px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo className="size-7 bg-white text-zinc-900 dark:bg-white dark:text-zinc-900" />
          <span className="text-base font-semibold">{SITE_NAME} 관리</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {adminNavGroups.map((group, index) => (
          <SidebarGroup key={group.label ?? index}>
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) =>
                  renderItem(
                    item,
                    item.href === '/admin/comments'
                      ? pendingReplyCount
                      : undefined
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-2">
        <SidebarMenu>{adminFooterItems.map((item) => renderItem(item))}</SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
