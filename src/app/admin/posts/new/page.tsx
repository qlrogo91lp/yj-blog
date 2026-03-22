import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getCategories } from '@/db/queries/categories';
import { NewPostPageAction } from './_actions/newpost-page-action';

export default async function NewPostPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const categories = await getCategories();

  return <NewPostPageAction categories={categories} />;
}
