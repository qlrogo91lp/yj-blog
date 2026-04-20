# 수정 계획: HTML 포맷 글에 목차(TOC) 지원 추가

> 작성일: 2026-04-21

## 현재 구조

```
src/
├── lib/
│   └── markdown.ts                  # markdownToHtmlWithToc 함수 (Markdown 전용)
└── app/(main)/posts/[slug]/
    ├── page.tsx                     # contentFormat === 'html'이면 toc: [] 강제
    └── _components/
        └── post-toc.tsx             # TocItem[] 받아 렌더링, document.getElementById로 스크롤
```

## 분석 요약

### 문제점

`page.tsx`의 toc 분기:

```tsx
const { html: contentHtml, toc } =
  post.contentFormat === 'html'
    ? { html: post.content, toc: [] }           // ← HTML이면 파싱 없이 무조건 []
    : await markdownToHtmlWithToc(post.content);
```

- WYSIWYG(TipTap) 에디터는 `<h2>제목</h2>` 형태의 HTML을 저장하지만 `id` 속성이 없음
- `PostToc`는 `document.getElementById(id)`로 헤딩을 찾으므로 id가 없으면 스크롤 연동 불가
- 따라서 단순 파싱만이 아니라 **id를 주입한 HTML도 반환**해야 함

### 필요한 변경

1. `rehype-parse` 패키지 설치 (HTML → hast 파싱용, 현재 미설치)
2. `markdown.ts`에 `htmlToHtmlWithToc` 함수 추가
3. `page.tsx`에서 `contentFormat === 'html'` 분기를 `htmlToHtmlWithToc` 호출로 교체

---

## 수정 계획

### 1. `rehype-parse` 설치

**이유**: 현재 unified 파이프라인은 Markdown → hast 변환(`remark-rehype`)만 지원한다. HTML 문자열을 hast로 파싱하려면 `rehype-parse`가 필요하다. `rehype-stringify`, `rehype-slug`, `unist-util-visit`은 이미 설치되어 있으므로 추가 비용 없이 재사용 가능하다.

```bash
npm install rehype-parse
```

---

### 2. `src/lib/markdown.ts` — `htmlToHtmlWithToc` 함수 추가

**현재 코드** (49~75번 줄, Markdown 전용)

```ts
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
```

**수정 후** (import 추가 + 새 함수 추가)

```ts
import rehypeParse from 'rehype-parse';  // 추가

// 기존 함수들 유지 ...

export async function htmlToHtmlWithToc(html: string): Promise<MarkdownResult> {
  const toc: TocItem[] = [];

  const processor = unified()
    .use(rehypeParse, { fragment: true })  // HTML 문자열 → hast (fragment: body 태그 래핑 없이)
    .use(rehypeSlug)                       // h2/h3에 id 자동 부여 (텍스트 기반 slug)
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
    .use(rehypeStringify);  // allowDangerousHtml 불필요 (이미 HTML 입력)

  const result = await processor.process(html);
  return { html: result.toString(), toc };
}
```

**이유**: `markdownToHtmlWithToc`와 로직이 동일하지만 시작점이 Markdown이 아닌 HTML이다. `rehype-slug`가 `<h2>텍스트</h2>` → `<h2 id="텍스트">텍스트</h2>` 로 id를 자동 주입하므로, `PostToc`의 `document.getElementById` 스크롤 연동도 정상 동작한다.

---

### 3. `src/app/(main)/posts/[slug]/page.tsx` — 분기 교체

**현재 코드** (33~36번 줄)

```tsx
import { markdownToHtmlWithToc } from '@/lib/markdown';

const { html: contentHtml, toc } =
  post.contentFormat === 'html'
    ? { html: post.content, toc: [] }
    : await markdownToHtmlWithToc(post.content);
```

**수정 후**

```tsx
import { markdownToHtmlWithToc, htmlToHtmlWithToc } from '@/lib/markdown';

const { html: contentHtml, toc } =
  post.contentFormat === 'html'
    ? await htmlToHtmlWithToc(post.content)
    : await markdownToHtmlWithToc(post.content);
```

**이유**: 분기를 삼항 → 두 함수 호출로 교체한다. `htmlToHtmlWithToc`가 id가 주입된 HTML과 toc를 동시에 반환하므로 이후 렌더링 로직(`PostToc`, `dangerouslySetInnerHTML`)은 변경 없이 그대로 동작한다.

---

## 변경 후 구조

```
src/
├── lib/
│   └── markdown.ts                  # htmlToHtmlWithToc 함수 추가
└── app/(main)/posts/[slug]/
    ├── page.tsx                     # htmlToHtmlWithToc 호출로 교체
    └── _components/
        └── post-toc.tsx             # 변경 없음
```

## 체크리스트

- [ ] `rehype-parse` 패키지 설치
- [ ] `markdown.ts`에 `rehype-parse` import 추가
- [ ] `markdown.ts`에 `htmlToHtmlWithToc` 함수 추가
- [ ] `page.tsx` import에 `htmlToHtmlWithToc` 추가
- [ ] `page.tsx` toc 분기를 `htmlToHtmlWithToc` 호출로 교체
- [ ] WYSIWYG으로 작성한 h2/h3 포함 글에서 목차 렌더링 확인
- [ ] 목차 항목 클릭 시 해당 헤딩으로 스크롤 연동 확인
- [ ] HTML 포맷이지만 h2/h3 없는 글에서 목차 미표시 확인
