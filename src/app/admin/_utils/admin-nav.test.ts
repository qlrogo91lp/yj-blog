import { describe, expect, it } from 'vitest';
import { adminFooterItems, adminNavGroups, getBreadcrumb } from './admin-nav';

describe('adminNavGroups', () => {
  it('대시보드·콘텐츠·통계 3개 그룹을 가진다', () => {
    expect(adminNavGroups).toHaveLength(3);
    expect(adminNavGroups[1].label).toBe('콘텐츠');
    expect(adminNavGroups[2].label).toBe('통계');
  });

  it('첫 그룹은 라벨 없이 대시보드만 담는다', () => {
    expect(adminNavGroups[0].label).toBeUndefined();
    expect(adminNavGroups[0].items).toHaveLength(1);
    expect(adminNavGroups[0].items[0].href).toBe('/admin');
  });

  it('블로그 설정과 블로그 보기는 하단 메뉴에 있다', () => {
    expect(adminFooterItems.map((item) => item.href)).toEqual([
      '/admin/settings',
      '/',
    ]);
  });

  it('본문 메뉴에는 블로그 설정이 없다', () => {
    const hrefs = adminNavGroups.flatMap((group) =>
      group.items.map((item) => item.href)
    );
    expect(hrefs).not.toContain('/admin/settings');
  });
});

describe('getBreadcrumb', () => {
  it('대시보드는 그룹 라벨 없이 항목명만 반환한다', () => {
    expect(getBreadcrumb('/admin')).toEqual(['대시보드']);
  });

  it('그룹에 속한 화면은 [그룹, 항목]을 반환한다', () => {
    expect(getBreadcrumb('/admin/categories')).toEqual(['콘텐츠', '카테고리 관리']);
  });

  it('더 긴 경로가 있으면 그쪽에 매칭한다', () => {
    expect(getBreadcrumb('/admin/statistics/referrers')).toEqual([
      '통계',
      '유입경로',
    ]);
  });

  it('하위 경로는 상위 항목에 매칭한다', () => {
    expect(getBreadcrumb('/admin/posts/new')).toEqual(['콘텐츠', '글 관리']);
  });

  it('하단 메뉴 항목도 매칭한다', () => {
    expect(getBreadcrumb('/admin/settings')).toEqual(['블로그 설정']);
  });

  it('매칭되는 항목이 없으면 빈 배열을 반환한다', () => {
    expect(getBreadcrumb('/admin/unknown')).toEqual([]);
  });
});
