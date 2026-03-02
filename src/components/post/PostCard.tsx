import Link from "next/link"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PostWithCategory } from "@/types"

interface Props {
  post: PostWithCategory
}

export function PostCard({ post }: Props) {
  const publishedAt = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <Link href={`/posts/${post.slug}`} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          {post.category && (
            <Badge variant="secondary" className="w-fit">
              {post.category.name}
            </Badge>
          )}
          <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
        </CardHeader>
        {post.excerpt && (
          <CardContent>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {post.excerpt}
            </p>
          </CardContent>
        )}
        {publishedAt && (
          <CardFooter>
            <time className="text-xs text-muted-foreground">{publishedAt}</time>
          </CardFooter>
        )}
      </Card>
    </Link>
  )
}
