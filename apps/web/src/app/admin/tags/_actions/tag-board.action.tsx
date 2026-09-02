'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addTag } from '@/app/admin/posts/new/_services/add-tag';
import type { TagWithCount } from '@/types';
import { TagChip } from '../_components/tag-chip';
import { removeUnusedTags } from '../_services/remove-unused-tags';

type Props = {
  tags: TagWithCount[];
};

export function TagBoardAction({ tags }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

  const sortedTags = [...tags].sort((a, b) => {
    if (b.postCount !== a.postCount) return b.postCount - a.postCount;
    return a.name.localeCompare(b.name);
  });
  const usedTags = sortedTags.filter((tag) => tag.postCount > 0);
  const unusedTags = sortedTags.filter((tag) => tag.postCount === 0);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !name.trim()) return;
    event.preventDefault();

    startTransition(async () => {
      const result = await addTag(name);
      if (result.success) {
        setName('');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleCleanup = () => {
    startTransition(async () => {
      const result = await removeUnusedTags();
      if (result.success) {
        toast.success(`미사용 태그 ${result.removed}개를 정리했습니다`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        placeholder="새 태그 이름을 입력하고 Enter"
      />

      <section>
        <h2 className="text-muted-foreground mb-2 text-sm">사용 중</h2>
        {usedTags.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            글에 붙은 태그가 없습니다.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {usedTags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </section>

      {unusedTags.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-muted-foreground text-sm">글에 쓰이지 않음</h2>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleCleanup}
              className="text-status-danger hover:text-status-danger"
            >
              미사용 {unusedTags.length}개 정리
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {unusedTags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
