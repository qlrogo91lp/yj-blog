'use client';

import type { TagRow } from './columns';
import { DeleteTagAction } from '../_actions/delete-tag.action';

type Props = {
  tag: TagRow;
};

export function TagActionsCell({ tag }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      <DeleteTagAction tag={tag} />
    </div>
  );
}
