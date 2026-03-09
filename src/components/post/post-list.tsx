"use client"

import { useState } from "react"
import { LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PostCard } from "./post-card"
import { PostListItem } from "./post-list-item"
import type { PostWithCategory } from "@/types"

interface Props {
  posts: PostWithCategory[]
  total: number
  hideTitleBar?: boolean
}

type ViewType = "card" | "list"

export function PostList({ posts, total, hideTitleBar }: Props) {
  const [viewType, setViewType] = useState<ViewType>("card")

  return (
    <div className={hideTitleBar ? "" : "mx-auto max-w-3xl px-4 py-8"}>
      <div className="mb-6 flex items-center justify-between">
        {!hideTitleBar && (
          <h1 className="text-2xl font-bold">
            최신 글{" "}
            <span className="text-base font-normal text-muted-foreground">
              ({total}편)
            </span>
          </h1>
        )}
        <div className="flex gap-1 ml-auto">
          <Button
            variant={viewType === "card" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewType("card")}
            aria-label="카드 뷰"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewType("list")}
            aria-label="리스트 뷰"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          아직 작성된 글이 없습니다.
        </p>
      ) : viewType === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y">
          {posts.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
