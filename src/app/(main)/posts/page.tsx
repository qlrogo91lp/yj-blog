import { Suspense } from "react"
import { getPosts } from "@/db/queries/posts"
import { getCategories, getCategoryBySlug } from "@/db/queries/categories"
import { PostList } from "@/components/post/post-list"
import { CategoryFilterAction } from "./_actions/category-filter-action"

type Props = {
  searchParams: Promise<{ category?: string; page?: string }>
}

export default async function PostsPage({ searchParams }: Props) {
  const { category: categorySlug, page: pageStr } = await searchParams
  const page = Number(pageStr) || 1

  const [categoriesData, categoryData] = await Promise.all([
    getCategories(),
    categorySlug ? getCategoryBySlug(categorySlug) : null,
  ])

  const { items: posts, total } = await getPosts({
    categoryId: categoryData?.id,
    page,
    limit: 10,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">
          글 목록{" "}
          <span className="text-base font-normal text-muted-foreground">
            ({total}편)
          </span>
        </h1>
        <Suspense>
          <CategoryFilterAction
            categories={categoriesData}
            currentSlug={categorySlug}
          />
        </Suspense>
      </div>

      <PostList posts={posts} total={total} hideTitleBar />
    </div>
  )
}
