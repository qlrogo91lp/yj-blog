'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // admin 경로는 트래킹하지 않음
    if (pathname.startsWith('/admin')) return;

    // /posts/[slug] 패턴이면 slug 추출
    const postMatch = pathname.match(/^\/posts\/([^/]+)$/);
    const slug = postMatch ? postMatch[1] : undefined;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrer: document.referrer, slug }),
    }).catch(() => {
      // 트래킹 실패는 무시
    });
  }, [pathname]);

  return null;
}
