import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { PostList } from "./PostList"
import type { PostWithCategory } from "@/types"

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height, className }: { src: string; alt: string; width: number; height: number; className?: string }) => (
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}))

const basePost = {
  content: "내용",
  thumbnailUrl: null,
  status: "published" as const,
  views: 0,
  categoryId: null,
  metaTitle: null,
  metaDescription: null,
  category: null,
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-15"),
}

const mockPosts: PostWithCategory[] = [
  { ...basePost, id: 1, title: "첫 번째 글", slug: "first-post", excerpt: "요약1", publishedAt: new Date("2024-01-15") },
  { ...basePost, id: 2, title: "두 번째 글", slug: "second-post", excerpt: null, publishedAt: null },
]

describe("PostList", () => {
  it("제목 heading을 렌더링한다", () => {
    render(<PostList posts={mockPosts} total={2} />)
    expect(screen.getByRole("heading", { name: /최신 글/ })).toBeInTheDocument()
  })

  it("총 글 수를 렌더링한다", () => {
    render(<PostList posts={mockPosts} total={2} />)
    expect(screen.getByText("(2편)")).toBeInTheDocument()
  })

  it("posts가 빈 배열이면 빈 상태 메시지를 렌더링한다", () => {
    render(<PostList posts={[]} total={0} />)
    expect(screen.getByText("아직 작성된 글이 없습니다.")).toBeInTheDocument()
  })

  it("기본 뷰(카드)에서 모든 글 제목이 보인다", () => {
    render(<PostList posts={mockPosts} total={2} />)
    expect(screen.getByText("첫 번째 글")).toBeInTheDocument()
    expect(screen.getByText("두 번째 글")).toBeInTheDocument()
  })

  it("리스트 뷰 버튼 클릭 시 뷰가 전환되어도 글 제목이 유지된다", () => {
    render(<PostList posts={mockPosts} total={2} />)
    fireEvent.click(screen.getByRole("button", { name: "리스트 뷰" }))
    expect(screen.getByText("첫 번째 글")).toBeInTheDocument()
    expect(screen.getByText("두 번째 글")).toBeInTheDocument()
  })

  it("카드 뷰 버튼 클릭 시 카드 뷰로 돌아온다", () => {
    render(<PostList posts={mockPosts} total={2} />)
    fireEvent.click(screen.getByRole("button", { name: "리스트 뷰" }))
    fireEvent.click(screen.getByRole("button", { name: "카드 뷰" }))
    expect(screen.getByText("첫 번째 글")).toBeInTheDocument()
  })
})
