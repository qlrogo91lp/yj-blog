import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getPostById } from '@/db/queries/posts'
import { getCategories } from '@/db/queries/categories'
import { EditPostPageAction } from './_action/EditPostPageAction'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params
  const postId = Number(id)
  if (Number.isNaN(postId)) notFound()

  const [post, categories] = await Promise.all([
    getPostById(postId),
    getCategories(),
  ])

  if (!post) notFound()

  return (
    <EditPostPageAction
      post={post}
      categories={categories}
    />
  )
}
