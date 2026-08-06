import { PostTileVertical } from './post-tile-vertical';
import type { PostWithCategory, TagSummary } from '@/types';

type Props = {
  post: PostWithCategory;
  tags?: TagSummary[];
  priority?: boolean;
};

export function PostTile2up(props: Props) {
  return <PostTileVertical {...props} size="md" />;
}
