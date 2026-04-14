import { getAllTags } from '@/db/queries/tags';
import { TagTable } from './_components/tag-table';

export default async function AdminTagsPage() {
  const tags = await getAllTags();

  return <TagTable tags={tags} />;
}
