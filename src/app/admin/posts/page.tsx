import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { getAllPostsForAdmin } from "@/db/queries/posts"
import { Badge } from "@/components/ui/badge"

export default async function AdminPostsPage() {
  const posts = await getAllPostsForAdmin()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">글 관리</h1>
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">제목</th>
              <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">카테고리</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">수정일</th>
              <th className="px-4 py-3 text-left font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  작성된 글이 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="font-medium hover:underline"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {post.category?.name ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {format(new Date(post.updatedAt), "yyyy년 M월 d일", { locale: ko })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status === "published" ? "발행" : "임시저장"}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
