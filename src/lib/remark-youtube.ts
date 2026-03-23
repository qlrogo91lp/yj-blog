import type { Plugin } from 'unified';
import type { Root, Paragraph, Text } from 'mdast';
import { visit } from 'unist-util-visit';

// ::youtube[VIDEO_ID] 형식을 HTML raw node로 변환
export const remarkYoutube: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
    if (!parent || index === undefined) return;
    const child = node.children[0];
    if (child?.type !== 'text') return;

    const match = (child as Text).value.match(/^::youtube\[([^\]]+)\]$/);
    if (!match) return;

    const videoId = match[1];
    const html = `<div data-youtube-video><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" allowfullscreen></iframe></div>`;

    parent.children.splice(index, 1, {
      type: 'html',
      value: html,
    } as never);
  });
};
