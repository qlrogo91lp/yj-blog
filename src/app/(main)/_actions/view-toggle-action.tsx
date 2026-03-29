'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  viewType: 'card' | 'list';
};

export function ViewToggleAction({ viewType }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleToggle = (type: 'card' | 'list') => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'card') {
      params.delete('view');
    } else {
      params.set('view', type);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex items-center gap-1 ml-auto">
      <Button
        variant={viewType === 'card' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => handleToggle('card')}
        aria-label="카드 뷰"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewType === 'list' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => handleToggle('list')}
        aria-label="리스트 뷰"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
