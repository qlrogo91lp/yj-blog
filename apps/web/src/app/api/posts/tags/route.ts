import { NextRequest, NextResponse } from 'next/server';
import { selectPosts } from '@/db/queries/posts';
import { selectCategoryBySlug } from '@/db/queries/categories';
import { getTagBySlug, selectTagsByPostIds } from '@/db/queries/tags';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const categorySlug = searchParams.get('category') ?? undefined;
  const tagSlug = searchParams.get('tag') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const [categoryData, tagData] = await Promise.all([
    categorySlug ? selectCategoryBySlug(categorySlug) : null,
    tagSlug ? getTagBySlug(tagSlug) : null,
  ]);

  const { items: posts } = await selectPosts({
    categoryId: categoryData?.id,
    tagId: tagData?.id,
    page,
    limit,
    search,
  });

  const tagsMap = await selectTagsByPostIds(posts.map((p) => p.id));
  const serialized = Object.fromEntries(tagsMap);

  return NextResponse.json(serialized);
}
