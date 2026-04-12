import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTags } from '@/db/queries/tags';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: '태그 목록',
  description: '블로그의 모든 태그 목록입니다.',
};

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">태그 목록</h1>
      {tags.length === 0 ? (
        <p className="text-muted-foreground">등록된 태그가 없습니다.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link key={tag.id} href={`/tags/${tag.slug}`}>
              <Badge variant="outline" className="text-sm px-3 py-1">
                #{tag.name}
                <span className="ml-1.5 text-muted-foreground">{tag.postCount}</span>
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
