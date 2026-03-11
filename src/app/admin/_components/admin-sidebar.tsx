"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  MessageSquare,
  BarChart3,
  ExternalLink,
  Settings,
  Globe,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"

const menuGroups = [
  {
    items: [
      { label: "대시보드", icon: LayoutDashboard, href: "/admin" },
    ],
  },
  {
    label: "콘텐츠",
    items: [
      { label: "글 관리", icon: FileText, href: "/admin/posts" },
      { label: "카테고리 관리", icon: FolderOpen, href: "/admin/categories" },
      { label: "댓글 관리", icon: MessageSquare, href: "/admin/comments" },
    ],
  },
  {
    label: "통계",
    items: [
      { label: "방문 통계", icon: BarChart3, href: "/admin/statistics" },
      { label: "유입경로", icon: ExternalLink, href: "/admin/statistics/referrers" },
    ],
  },
  {
    label: "설정",
    items: [
      { label: "블로그 설정", icon: Settings, href: "/admin/settings" },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/admin" className="font-semibold text-lg">
          YJ Blog 관리
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group, i) => (
          <SidebarGroup key={i}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Globe className="h-4 w-4" />
          블로그 보기
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
