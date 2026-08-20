import type { TagWithCount } from '@/types';
import { DeleteTagAction } from '../_actions/delete-tag.action';

type Props = {
  tag: TagWithCount;
};

export function TagChip({ tag }: Props) {
  const isUnused = tag.postCount === 0;

  if (isUnused) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-sm">
        #{tag.name}
        <DeleteTagAction tag={tag} />
      </span>
    );
  }

  return (
    <span className="bg-muted inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm">
      #{tag.name}
      <span className="bg-background text-muted-foreground rounded-full px-1.5 text-xs">
        {tag.postCount}
      </span>
    </span>
  );
}
