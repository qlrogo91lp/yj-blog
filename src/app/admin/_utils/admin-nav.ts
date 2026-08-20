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

/** 사이드바 활성 항목·브레드크럼이 공유하는 경로 매칭 규칙 */
export function isNavItemActive(pathname: string, href: string): boolean {
  // '/admin'과 '/'는 다른 모든 경로의 접두사이므로 정확히 일치할 때만 매칭한다
  if (href === '/admin' || href === '/') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 여러 항목의 href가 동시에 pathname과 매칭될 수 있으므로(예: /admin/statistics와
 * /admin/statistics/referrers), 가장 긴 href 하나만 "현재 위치"로 고른다.
 * 사이드바 active pill과 헤더 브레드크럼이 항상 같은 항목을 가리키도록 이 하나의
 * 판정 결과를 공유한다.
 */
function findLongestMatch(pathname: string) {
  return searchable
    .filter(({ item }) => isNavItemActive(pathname, item.href))
    .sort((a, b) => b.item.href.length - a.item.href.length)[0];
}

export function getBreadcrumb(pathname: string): string[] {
  const matched = findLongestMatch(pathname);

  if (!matched) return [];

  return matched.groupLabel
    ? [matched.groupLabel, matched.item.label]
    : [matched.item.label];
}

/** 사이드바에서 active pill로 표시할 단 하나의 href. 없으면 undefined. */
export function getActiveNavHref(pathname: string): string | undefined {
  return findLongestMatch(pathname)?.item.href;
}

/** 글쓰기 에디터(새 글/수정) 경로 — 사이드바·헤더·본문 폭이 이 경로에서 다르게 동작한다 */
export function isEditorPath(pathname: string): boolean {
  return (
    pathname === '/admin/posts/new' ||
    (pathname.startsWith('/admin/posts/') && pathname.endsWith('/edit'))
  );
}
