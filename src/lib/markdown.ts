import rehypeHighlight from 'rehype-highlight';
import rehypeParse from 'rehype-parse';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import type { Element } from 'hast';
import { remarkYoutube } from './remark-youtube';

export type TocItem = {
  level: 2 | 3;
  text: string;
  id: string;
};

export type MarkdownResult = {
  html: string;
  toc: TocItem[];
};

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkYoutube)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeHighlight)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return result.toString();
}

function extractText(node: Element): string {
  let text = '';
  for (const child of node.children) {
    if (child.type === 'text') {
      text += child.value;
    } else if (child.type === 'element') {
      text += extractText(child);
    }
  }
  return text;
}

export async function markdownToHtmlWithToc(markdown: string): Promise<MarkdownResult> {
  const toc: TocItem[] = [];

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkYoutube)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(() => (tree) => {
      visit(tree, 'element', (node: Element) => {
        if (node.tagName === 'h2' || node.tagName === 'h3') {
          const id = node.properties?.id as string | undefined;
          const text = extractText(node);
          if (id && text) {
            toc.push({ level: Number(node.tagName[1]) as 2 | 3, text, id });
          }
        }
      });
    })
    .use(rehypeHighlight)
    .use(rehypeStringify, { allowDangerousHtml: true });

  const result = await processor.process(markdown);

  return { html: result.toString(), toc };
}

export async function htmlToHtmlWithToc(html: string): Promise<MarkdownResult> {
  const toc: TocItem[] = [];

  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSlug)
    .use(() => (tree) => {
      visit(tree, 'element', (node: Element) => {
        if (node.tagName === 'h2' || node.tagName === 'h3') {
          const id = node.properties?.id as string | undefined;
          const text = extractText(node);
          if (id && text) {
            toc.push({ level: Number(node.tagName[1]) as 2 | 3, text, id });
          }
        }
      });
    })
    .use(rehypeStringify);

  const result = await processor.process(html);

  return { html: result.toString(), toc };
}
