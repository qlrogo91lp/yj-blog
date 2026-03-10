import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCategories } from '@/db/queries/categories'
import { NewPostPageClient } from './_components/newpost-page-client'

export default async function NewPostPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const categories = await getCategories()

  return <NewPostPageClient categories={categories} />
}
