import { NextRequest, NextResponse } from 'next/server';
import { getPosts } from '@/db/queries/posts';
import { getCategoryBySlug } from '@/db/queries/categories';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const categorySlug = searchParams.get('category') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const categoryData = categorySlug ? await getCategoryBySlug(categorySlug) : null;

  const result = await getPosts({
    categoryId: categoryData?.id,
    page,
    limit,
    search,
  });

  return NextResponse.json(result);
}
