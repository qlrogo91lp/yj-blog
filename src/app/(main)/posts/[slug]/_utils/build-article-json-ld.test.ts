import { describe, expect, it } from 'vitest';
import { buildArticleJsonLd } from './build-article-json-ld';

const basePost = {
  title: '테스트 글',
  slug: 'test-post',
  excerpt: '요약',
  metaTitle: null,
  metaDescription: null,
  thumbnailUrl: null,
  publishedAt: new Date('2026-04-20T00:00:00Z'),
  updatedAt: new Date('2026-04-25T00:00:00Z'),
};

describe('buildArticleJsonLd', () => {
  it('필수 필드를 모두 포함한다', () => {
    const json = buildArticleJsonLd({
      post: basePost,
      blogName: 'YJlogs',
      baseUrl: 'https://yjlogs.com',
    });
    expect(json['@context']).toBe('https://schema.org');
    expect(json['@type']).toBe('BlogPosting');
    expect(json.headline).toBe('테스트 글');
    expect(json.description).toBe('요약');
    expect(json.url).toBe('https://yjlogs.com/posts/test-post');
    expect(json.mainEntityOfPage).toBe('https://yjlogs.com/posts/test-post');
    expect(json.datePublished).toBe('2026-04-20T00:00:00.000Z');
    expect(json.dateModified).toBe('2026-04-25T00:00:00.000Z');
  });

  it('thumbnailUrl이 없으면 og-default.png 절대 URL을 image로 쓴다', () => {
    const json = buildArticleJsonLd({
      post: basePost,
      blogName: 'YJlogs',
      baseUrl: 'https://yjlogs.com',
    });
    expect(json.image).toBe('https://yjlogs.com/og-default.png');
  });

  it('thumbnailUrl이 있으면 그대로 image로 쓴다', () => {
    const json = buildArticleJsonLd({
      post: { ...basePost, thumbnailUrl: 'https://r2/thumb.png' },
      blogName: 'YJlogs',
      baseUrl: 'https://yjlogs.com',
    });
    expect(json.image).toBe('https://r2/thumb.png');
  });

  it('metaTitle/metaDescription이 있으면 우선 사용한다', () => {
    const json = buildArticleJsonLd({
      post: { ...basePost, metaTitle: 'SEO 제목', metaDescription: 'SEO 설명' },
      blogName: 'YJlogs',
      baseUrl: 'https://yjlogs.com',
    });
    expect(json.headline).toBe('SEO 제목');
    expect(json.description).toBe('SEO 설명');
  });

  it('author와 publisher에 blogName을 사용한다', () => {
    const json = buildArticleJsonLd({
      post: basePost,
      blogName: 'YJlogs',
      baseUrl: 'https://yjlogs.com',
    });
    expect(json.author).toEqual({ '@type': 'Person', name: 'YJlogs' });
    expect(json.publisher).toEqual({
      '@type': 'Organization',
      name: 'YJlogs',
      logo: { '@type': 'ImageObject', url: 'https://yjlogs.com/og-default.png' },
    });
  });
});
