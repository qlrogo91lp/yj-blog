"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { Category } from "@/types"

interface Props {
  categories: Category[]
  currentSlug?: string
}

export function CategoryFilter({ categories, currentSlug }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(slug?: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    if (slug) {
      params.set("category", slug)
    } else {
      params.delete("category")
    }
    router.push(`/posts?${params.toString()}`)
  }

  const tabs = [{ slug: undefined, name: "전체" }, ...categories]

  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => {
        const isActive = tab.slug === currentSlug
        return (
          <button
            key={tab.slug ?? "all"}
            onClick={() => navigate(tab.slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.name}
          </button>
        )
      })}
    </div>
  )
}
