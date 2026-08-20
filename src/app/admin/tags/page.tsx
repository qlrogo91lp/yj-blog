import { getAllTags } from '@/db/queries/tags';
import { AdminPageHeader } from '../_components/admin-page-header';
import { TagBoardAction } from './_actions/tag-board.action';

export default async function AdminTagsPage() {
  const tags = await getAllTags();
  const unusedCount = tags.filter((tag) => tag.postCount === 0).length;

  return (
    <div>
      <AdminPageHeader
        title="태그 관리"
        description={
          unusedCount > 0
            ? `태그 ${tags.length}개 · 이 중 ${unusedCount}개는 글에 쓰이지 않음`
            : `태그 ${tags.length}개`
        }
      />
      <TagBoardAction tags={tags} />
    </div>
  );
}
