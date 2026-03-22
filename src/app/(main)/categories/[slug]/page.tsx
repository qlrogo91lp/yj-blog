import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostList } from '@/components/post/post-list';
import { getCategoryBySlug } from '@/db/queries/categories';
import { getPosts } from '@/db/queries/posts';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} 글 목록`,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const { items: posts, total } = await getPosts({ categoryId: category.id });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-1">카테고리</p>
        <h1 className="text-2xl font-bold">
          {category.name}{' '}
          <span className="text-base font-normal text-muted-foreground">
            ({total}편)
          </span>
        </h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>

      <PostList posts={posts} total={total} hideTitleBar />
    </div>
  );
}
