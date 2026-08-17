import { describe, it, expect } from 'vitest';
import { htmlToHtmlWithToc } from './markdown';

describe('htmlToHtmlWithToc — 이미지 캡션', () => {
  it('data-caption이 있는 img를 figure + figcaption으로 변환한다', async () => {
    const html =
      '<p><img src="a.png" data-size="default" data-align="center" data-caption="강남역 저녁" /></p>';
    const { html: result } = await htmlToHtmlWithToc(html);
    expect(result).toContain('<figure');
    expect(result).toContain('<figcaption>강남역 저녁</figcaption>');
    expect(result).not.toContain('data-caption');
  });

  it('figure에 data-size, data-align이 유지된다', async () => {
    const html =
      '<p><img src="a.png" data-size="small" data-align="left" data-caption="설명" /></p>';
    const { html: result } = await htmlToHtmlWithToc(html);
    expect(result).toContain('data-size="small"');
    expect(result).toContain('data-align="left"');
  });

  it('data-caption이 없는 img는 변환하지 않는다', async () => {
    const html = '<p><img src="a.png" data-size="default" data-align="center" /></p>';
    const { html: result } = await htmlToHtmlWithToc(html);
    expect(result).not.toContain('<figure');
    expect(result).not.toContain('<figcaption>');
  });

  it('p 안에 img 외 다른 자식이 있으면 변환하지 않는다', async () => {
    const html =
      '<p>텍스트 <img src="a.png" data-caption="설명" /> 뒤에도 텍스트</p>';
    const { html: result } = await htmlToHtmlWithToc(html);
    expect(result).not.toContain('<figure');
  });
});

describe('htmlToHtmlWithToc — 갤러리', () => {
  const gallery =
    '<div data-gallery>' +
    '<figure><img src="a.png" alt="가" width="1600" height="1067"><figcaption>거실</figcaption></figure>' +
    '<figure><img src="b.png" alt="나" width="1067" height="1600"></figure>' +
    '</div>';

  it('data-gallery 구조를 그대로 통과시킨다', async () => {
    const { html } = await htmlToHtmlWithToc(gallery);
    expect(html).toContain('data-gallery');
    expect(html).toContain('src="a.png"');
    expect(html).toContain('src="b.png"');
    expect(html).toContain('width="1600"');
  });

  it('갤러리 안의 figure를 rehypeImageCaption이 건드리지 않는다', async () => {
    const { html } = await htmlToHtmlWithToc(gallery);
    expect((html.match(/<figure/g) ?? []).length).toBe(2);
    expect(html).toContain('<figcaption>거실</figcaption>');
  });
});
