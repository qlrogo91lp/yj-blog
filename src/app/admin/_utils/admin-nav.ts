import {
  BarChart3,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Settings,
  Tag,
} from 'lucide-react';

export type AdminNavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
};

export type AdminNavGroup = {
  label?: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    items: [{ label: '대시보드', icon: LayoutDashboard, href: '/admin' }],
  },
  {
    label: '콘텐츠',
    items: [
      { label: '글 관리', icon: FileText, href: '/admin/posts' },
      { label: '카테고리 관리', icon: FolderOpen, href: '/admin/categories' },
      { label: '시리즈 관리', icon: Layers, href: '/admin/series' },
      { label: '태그 관리', icon: Tag, href: '/admin/tags' },
      { label: '댓글 관리', icon: MessageSquare, href: '/admin/comments' },
    ],
  },
  {
    label: '통계',
    items: [
      { label: '방문 통계', icon: BarChart3, href: '/admin/statistics' },
      {
        label: '유입경로',
        icon: ExternalLink,
        href: '/admin/statistics/referrers',
      },
    ],
  },
];

export const adminFooterItems: AdminNavItem[] = [
  { label: '블로그 설정', icon: Settings, href: '/admin/settings' },
  { label: '블로그 보기', icon: Globe, href: '/' },
];

/** 사이드바 본문 + 하단 메뉴를 그룹 라벨과 함께 펼친 목록 */
const searchable: { groupLabel?: string; item: AdminNavItem }[] = [
  ...adminNavGroups.flatMap((group) =>
    group.items.map((item) => ({ groupLabel: group.label, item }))
  ),
  ...adminFooterItems.map((item) => ({ groupLabel: undefined, item })),
];

function isMatch(pathname: string, href: string): boolean {
  // '/admin'과 '/'는 다른 모든 경로의 접두사이므로 정확히 일치할 때만 매칭한다
  if (href === '/admin' || href === '/') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getBreadcrumb(pathname: string): string[] {
  const matched = searchable
    .filter(({ item }) => isMatch(pathname, item.href))
    .sort((a, b) => b.item.href.length - a.item.href.length)[0];

  if (!matched) return [];

  return matched.groupLabel
    ? [matched.groupLabel, matched.item.label]
    : [matched.item.label];
}
