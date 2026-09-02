'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isEditorPath } from '../_utils/admin-nav';

type Props = {
  children: ReactNode;
};

/**
 * 글쓰기 에디터는 sticky 툴바/하단 바가 화면 폭을 그대로 써야 해서
 * max-w-360 폭 제한에서 제외한다.
 */
export function AdminMainContainerHandler({ children }: Props) {
  const pathname = usePathname();

  if (isEditorPath(pathname)) {
    return <>{children}</>;
  }

  return <div className="mx-auto max-w-360">{children}</div>;
}
