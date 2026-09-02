import type { PostWithCategory, TagSummary } from '@/types';

export type PostsResponse = {
  items: PostWithCategory[];
  total: number;
};

export type TagsMapResponse = Record<number, TagSummary[]>;

export async function getPosts(params: URLSearchParams): Promise<PostsResponse> {
  const res = await fetch(`/api/posts?${params.toString()}`);
  return res.json();
}

export async function getPostsTags(params: URLSearchParams): Promise<TagsMapResponse> {
  const res = await fetch(`/api/posts/tags?${params.toString()}`);
  return res.json();
}
