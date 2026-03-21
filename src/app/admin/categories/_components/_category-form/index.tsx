'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categoryFormSchema, type CategoryFormValues } from '@/types/category'
import type { Category } from '@/types'
import { generateSlug } from '@/lib/slugify'
import { createCategoryAction } from './_services/create-category'
import { updateCategoryAction } from './_services/update-category'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
}

export function CategoryFormDialog({ open, onOpenChange, category }: Props) {
  const isEdit = !!category
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? '',
        slug: category?.slug ?? '',
        description: category?.description ?? '',
      })
    }
  }, [open, category, form])

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setError(null)
    }
    onOpenChange(value)
  }

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true)
    setError(null)

    const result = isEdit
      ? await updateCategoryAction(category.id, data)
      : await createCategoryAction(data)

    setIsSubmitting(false)

    if (result.success) {
      form.reset()
      onOpenChange(false)
    } else {
      setError(result.error)
    }
  }

  const handleNameBlur = () => {
    const name = form.getValues('name')
    const currentSlug = form.getValues('slug')
    if (name && !currentSlug) {
      form.setValue('slug', generateSlug(name), { shouldValidate: true })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '카테고리 수정' : '새 카테고리'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '카테고리 정보를 수정합니다.' : '새로운 카테고리를 추가합니다.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              placeholder="카테고리 이름"
              {...form.register('name')}
              onBlur={handleNameBlur}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="category-slug"
              {...form.register('slug')}
            />
            {form.formState.errors.slug && (
              <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              placeholder="카테고리 설명"
              rows={3}
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : isEdit ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
