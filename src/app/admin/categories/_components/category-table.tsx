'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { PencilIcon, TrashIcon } from 'lucide-react'
import type { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { CategoryFormDialog } from './category-form-dialog'
import { DeleteCategoryDialog } from './delete-category-dialog'

type Props = {
  categories: Category[]
}

export function CategoryTable({ categories }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const handleCreate = () => {
    setEditCategory(null)
    setFormOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditCategory(category)
    setFormOpen(true)
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <Button onClick={handleCreate}>
          새 카테고리
        </Button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">이름</th>
              <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Slug</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">설명</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">생성일</th>
              <th className="px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  카테고리가 없습니다.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {category.slug}
                  </td>
                  <td className="hidden max-w-48 truncate px-4 py-3 text-muted-foreground md:table-cell">
                    {category.description ?? '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {format(new Date(category.createdAt), 'yyyy년 M월 d일', { locale: ko })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(category)}
                      >
                        <PencilIcon className="size-4" />
                        <span className="sr-only">수정</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(category)}
                      >
                        <TrashIcon className="size-4" />
                        <span className="sr-only">삭제</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editCategory}
      />

      {deleteTarget && (
        <DeleteCategoryDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          category={deleteTarget}
        />
      )}
    </>
  )
}
