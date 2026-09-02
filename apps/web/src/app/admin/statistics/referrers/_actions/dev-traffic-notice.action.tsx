'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  count: number;
};

export function DevTrafficNoticeAction({ count }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (count === 0) return null;

  return (
    <div className="bg-muted mb-4 rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          localhost·개발 트래픽 {count.toLocaleString()}회는 접어뒀습니다
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? '접기' : '펼치기'}
        </Button>
      </div>

      {isExpanded && (
        <p className="text-muted-foreground mt-2 text-xs">
          localhost·127.0.0.1·`.local` 호스트와 사설 IP 대역(10.x, 192.168.x,
          172.16~31.x)에서 들어온 방문입니다. 아래 표와 비율 계산에서 빠져
          있습니다.
        </p>
      )}
    </div>
  );
}
