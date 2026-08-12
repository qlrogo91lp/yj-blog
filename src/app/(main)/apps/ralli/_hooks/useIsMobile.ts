'use client';

import { useEffect, useState } from 'react';

/** Replay 갤러리가 스크롤 연동 드리프트와 네이티브 가로 스크롤을 분기하는 데 사용한다. */
export function useIsMobile(query = '(max-width: 767px)'): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setIsMobile(mql.matches);

    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return isMobile;
}
