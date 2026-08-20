import { describe, expect, it } from 'vitest';
import { extractR2Keys } from './extract-r2-keys';

const publicUrl = 'https://pub.example.com';

describe('extractR2Keys', () => {
  it('public URL로 시작하는 img src에서 키를 추출한다', () => {
    const html = `<figure><img src="${publicUrl}/images/post-1/image1-123.png"></figure>`;
    expect(extractR2Keys(html, publicUrl)).toEqual(new Set(['images/post-1/image1-123.png']));
  });

  it('갤러리 안 여러 이미지의 키를 모두 모은다', () => {
    const html =
      `<div data-gallery=""><figure><img src="${publicUrl}/images/post-1/a.png"></figure>` +
      `<figure><img src="${publicUrl}/images/post-1/b.png"></figure></div>`;
    expect(extractR2Keys(html, publicUrl)).toEqual(
      new Set(['images/post-1/a.png', 'images/post-1/b.png']),
    );
  });

  it('외부 URL 이미지는 무시한다', () => {
    const html = `<img src="https://other.com/x.png"><img src='${publicUrl}/images/y.png'>`;
    expect(extractR2Keys(html, publicUrl)).toEqual(new Set(['images/y.png']));
  });

  it('publicUrl이 비어 있으면 빈 Set', () => {
    expect(extractR2Keys('<img src="https://a/b.png">', '')).toEqual(new Set());
  });

  it('이미지가 없으면 빈 Set', () => {
    expect(extractR2Keys('<p>텍스트</p>', publicUrl)).toEqual(new Set());
  });
});
