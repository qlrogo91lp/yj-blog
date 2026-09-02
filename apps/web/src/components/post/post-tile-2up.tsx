import type { PostWithCategory, TagSummary } from '@/types';
import { PostTileVertical } from './post-tile-vertical';

type Props = {
  post: PostWithCategory;
  tags?: TagSummary[];
  priority?: boolean;
};

export function PostTile2up(props: Props) {
  return <PostTileVertical {...props} size="md" />;
}
