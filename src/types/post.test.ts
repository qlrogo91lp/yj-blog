import { describe, it, expect } from "vitest"
import { postFormSchema } from "@/types/post"

const validData = {
  title: "테스트 제목",
  slug: "test-slug",
  content: "내용",
  contentFormat: "markdown" as const,
  status: "draft" as const,
  categoryId: null,
}

describe("postFormSchema", () => {
  describe("title", () => {
    it("빈 문자열이면 실패", () => {
      const result = postFormSchema.safeParse({ ...validData, title: "" })
      expect(result.success).toBe(false)
    })

    it("200자 초과면 실패", () => {
      const result = postFormSchema.safeParse({ ...validData, title: "a".repeat(201) })
      expect(result.success).toBe(false)
    })

    it("200자는 성공", () => {
      const result = postFormSchema.safeParse({ ...validData, title: "a".repeat(200) })
      expect(result.success).toBe(true)
    })
  })

  describe("slug", () => {
    it("영소문자·숫자·하이픈 조합은 성공", () => {
      expect(postFormSchema.safeParse({ ...validData, slug: "hello-world-123" }).success).toBe(true)
    })

    it("한글이 있으면 실패", () => {
      expect(postFormSchema.safeParse({ ...validData, slug: "한글-slug" }).success).toBe(false)
    })

    it("대문자가 있으면 실패", () => {
      expect(postFormSchema.safeParse({ ...validData, slug: "Test-Slug" }).success).toBe(false)
    })

    it("공백이 있으면 실패", () => {
      expect(postFormSchema.safeParse({ ...validData, slug: "hello world" }).success).toBe(false)
    })

    it("빈 문자열이면 실패", () => {
      expect(postFormSchema.safeParse({ ...validData, slug: "" }).success).toBe(false)
    })
  })

  describe("status", () => {
    it("draft는 성공", () => {
      expect(postFormSchema.safeParse({ ...validData, status: "draft" }).success).toBe(true)
    })

    it("published는 성공", () => {
      expect(postFormSchema.safeParse({ ...validData, status: "published" }).success).toBe(true)
    })

    it("그 외 값은 실패", () => {
      expect(postFormSchema.safeParse({ ...validData, status: "pending" }).success).toBe(false)
    })
  })

  describe("excerpt", () => {
    it("없어도 성공 (optional)", () => {
      const { excerpt: _, ...withoutExcerpt } = { ...validData, excerpt: undefined }
      expect(postFormSchema.safeParse(withoutExcerpt).success).toBe(true)
    })

    it("500자 초과면 실패", () => {
      const result = postFormSchema.safeParse({ ...validData, excerpt: "a".repeat(501) })
      expect(result.success).toBe(false)
    })

    it("500자는 성공", () => {
      const result = postFormSchema.safeParse({ ...validData, excerpt: "a".repeat(500) })
      expect(result.success).toBe(true)
    })
  })

  it("유효한 전체 데이터는 파싱 성공", () => {
    const result = postFormSchema.safeParse({
      title: "완전한 글 제목",
      slug: "complete-post",
      content: "본문 내용",
      contentFormat: "html",
      excerpt: "요약",
      status: "published",
      categoryId: 1,
      metaTitle: "SEO 제목",
      metaDescription: "SEO 설명",
      thumbnailUrl: "https://example.com/thumb.jpg",
    })
    expect(result.success).toBe(true)
  })
})
