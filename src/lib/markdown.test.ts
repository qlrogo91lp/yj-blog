import { describe, it, expect } from 'vitest';
import { htmlToHtmlWithToc } from './markdown';

describe('htmlToHtmlWithToc — 이미지 캡션', () => {
  it('data-caption이 있는 img를 figure + figcaption으로 변환한다', async () => {
    const html =
      '<p><img src="a.png" data-size="medium" data-align="center" data-caption="강남역 저녁" /></p>';
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
    const html = '<p><img src="a.png" data-size="medium" data-align="center" /></p>';
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
