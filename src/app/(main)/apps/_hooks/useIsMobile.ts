'use client';

import { useEffect, useState } from 'react';

/**
 * 뷰포트 분기. CSS로는 나눌 수 없는 경우에만 쓴다.
 * - ralli: replay 갤러리가 스크롤 연동 드리프트 / 네이티브 가로 스크롤을 분기
 * - golf-counter: hero의 stage 크기·칩 이동 벡터가 `useTransform` 출력 범위 값이라 CSS로 못 바꾼다
 */
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
