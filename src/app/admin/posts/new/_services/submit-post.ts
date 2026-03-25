import { generateSlug } from '@/lib/slugify';
import { useNewPostStore } from '../_store';
import { savePost } from './save-post';

export async function submitPost(status: 'draft' | 'published') {
  const store = useNewPostStore.getState();
  const slug = store.slug || generateSlug(store.title);

  store.setSaveStatus('saving');

  const result = await savePost({
    postId: store.postId,
    title: store.title,
    slug,
    content: store.content,
    contentFormat: store.contentFormat,
    categoryId: store.categoryId,
    thumbnailUrl: store.thumbnailUrl,
    status,
    publishedAt: store.publishedAt,
  });

  if (result.success) {
    store.setPostId(result.postId);
    store.setSlug(slug);
    store.setSaveStatus('saved');
    store.setLastSavedAt(new Date());
    return { success: true as const, slug };
  } else {
    store.setSaveStatus('error');
    return { success: false as const, error: result.error };
  }
}
