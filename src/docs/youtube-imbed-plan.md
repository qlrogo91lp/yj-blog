# 수정 계획: YouTube Embed 기능 추가

> 작성일: 2026-03-23

## 현재 구조

```
src/
├── app/
│   ├── (main)/posts/[slug]/page.tsx       # dangerouslySetInnerHTML로 HTML 렌더링
│   └── admin/posts/new/
│       ├── _actions/
│       │   ├── wysiwyg-editor-action.tsx  # Tiptap 에디터 (YouTube 확장 없음)
│       │   └── editor-toolbar-action.tsx  # 툴바 (YouTube 버튼 없음)
│       └── _components/
│           ├── _image-upload/index.tsx    # 이미지 다이얼로그 (참고 패턴)
│           └── _link/index.tsx            # 링크 다이얼로그 (참고 패턴)
├── lib/
│   └── markdown.ts                        # remark 파이프라인 (커스텀 플러그인 없음)
└── styles/
    └── prose.css                          # 글 상세 스타일 (iframe 스타일 없음)
next.config.ts                             # 빈 설정 (CSP 없음)
```

## 분석 요약

- 동영상 기능 **전혀 없음** — DB 스키마 변경 불필요 (content 컬럼에 HTML/마크다운으로 저장)
- Tiptap에 `@tiptap/extension-youtube` 공식 확장이 존재 → WYSIWYG 모드에서 바로 활용 가능
- 글 상세 페이지는 이미 `dangerouslySetInnerHTML`로 HTML을 렌더링하므로 iframe 추가 렌더링 가능
- 마크다운 모드에서는 커스텀 remark 플러그인으로 `::youtube[VIDEO_ID]` 문법 변환
- CSP 미설정 상태이므로 `next.config.ts`에 `frame-src` 추가 필요
- `prose.css`에 YouTube iframe 반응형 스타일 추가 필요

---

## 수정 계획

### 1. 패키지 설치 [High]

```bash
npm install @tiptap/extension-youtube
```

`@tiptap/extension-youtube`는 Tiptap 공식 확장으로:
- YouTube/Vimeo URL을 파싱해 video ID를 추출
- `<div data-youtube-video><iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" ...></iframe></div>` HTML 생성
- `allowFullscreen`, `width`, `height`, `nocookie` 등 옵션 제공

---

### 2. WysiwygEditorAction — YouTube 확장 추가 [High]

**파일**: `src/app/admin/posts/new/_actions/wysiwyg-editor-action.tsx`

**현재 코드**
```tsx
import { Image } from '@tiptap/extension-image';
// ...
extensions: [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Underline,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Highlight.configure({ multicolor: true }),
  Color,
  TextStyle,
  Link.configure({ openOnClick: false }),
  Image,
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
  Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
],
```

**수정 후**
```tsx
import { Image } from '@tiptap/extension-image';
import { Youtube } from '@tiptap/extension-youtube';
// ...
extensions: [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Underline,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Highlight.configure({ multicolor: true }),
  Color,
  TextStyle,
  Link.configure({ openOnClick: false }),
  Image,
  Youtube.configure({
    nocookie: true,          // youtube-nocookie.com 사용 (개인정보 보호)
    allowFullscreen: true,
    width: 640,
    height: 360,
  }),
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
  Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
],
```

**이유**: `nocookie: true`로 youtube-nocookie.com 사용 시 사용자 추적 최소화. 에디터가 YouTube URL을 iframe으로 자동 변환하여 HTML에 저장.

---

### 3. YouTube 다이얼로그 컴포넌트 생성 [High]

**파일**: `src/app/admin/posts/new/_components/_youtube/index.tsx` (신규)

기존 `_link/index.tsx` 패턴을 그대로 따름.

```tsx
'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function YoutubeEmbedDialog({ editor, open, onOpenChange }: Props) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor || !url) return;
    editor.commands.setYoutubeVideo({ src: url });
    setUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>YouTube 영상 삽입</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!url}>삽입</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**이유**: 기존 `_link`, `_image-upload` 다이얼로그와 동일한 패턴 유지. `editor.commands.setYoutubeVideo`는 `@tiptap/extension-youtube`가 제공하는 커맨드.

---

### 4. EditorToolbarAction — YouTube 버튼 추가 [High]

**파일**: `src/app/admin/posts/new/_actions/editor-toolbar-action.tsx`

**현재 코드**
```tsx
import {
  // ...
  ImageIcon,
  // ...
} from 'lucide-react';
// ...
const [isImageOpen, setIsImageOpen] = useState(false);
// ...
<ToolbarButton
  icon={ImageIcon}
  tooltip="이미지"
  onClick={() => setIsImageOpen(true)}
/>
// ...
<ImageUploadDialog
  editor={editor}
  open={isImageOpen}
  onOpenChange={setIsImageOpen}
/>
```

**수정 후**
```tsx
import {
  // ...
  ImageIcon,
  Youtube,          // lucide-react에 Youtube 아이콘 존재
  // ...
} from 'lucide-react';
import { YoutubeEmbedDialog } from '../_components/_youtube';
// ...
const [isImageOpen, setIsImageOpen] = useState(false);
const [isYoutubeOpen, setIsYoutubeOpen] = useState(false);
// ...
<ToolbarButton
  icon={ImageIcon}
  tooltip="이미지"
  onClick={() => setIsImageOpen(true)}
/>
<ToolbarButton
  icon={Youtube}
  tooltip="YouTube 영상"
  onClick={() => setIsYoutubeOpen(true)}
/>
// ...
<ImageUploadDialog
  editor={editor}
  open={isImageOpen}
  onOpenChange={setIsImageOpen}
/>
<YoutubeEmbedDialog
  editor={editor}
  open={isYoutubeOpen}
  onOpenChange={setIsYoutubeOpen}
/>
```

**이유**: 이미지 버튼 바로 옆에 위치시켜 미디어 삽입 그룹으로 묶음. lucide-react `Youtube` 아이콘 활용.

---

### 5. 마크다운 모드 — 커스텀 remark 플러그인 [Medium]

**파일**: `src/lib/markdown.ts`

마크다운에서 `::youtube[VIDEO_ID]` 문법을 YouTube iframe으로 변환하는 플러그인 추가.

**현재 코드**
```ts
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}
```

**수정 후**

`src/lib/remark-youtube.ts` 신규 파일 생성:

```ts
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
    } as any);
  });
};
```

`src/lib/markdown.ts` 수정:
```ts
import { remarkYoutube } from './remark-youtube';

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkYoutube)   // remarkRehype 이전에 삽입
    .use(remarkRehype, { allowDangerousHtml: true })  // raw HTML 허용
    .use(rehypeSlug)
    .use(rehypeHighlight)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return result.toString();
}
```

> **주의**: `allowDangerousHtml: true`는 관리자(본인)만 마크다운을 작성하는 개인 블로그이므로 안전함. 사용자 입력을 그대로 처리하는 경우엔 sanitize 필요.

**이유**: WYSIWYG 에디터에서 마크다운 모드로 전환 시 YouTube 블록을 텍스트로 표현하는 수단 제공. HTML 모드로 저장된 포스트는 이 플러그인 불필요.

**의존성 추가**:
```bash
npm install unist-util-visit
```
(이미 설치되어 있을 가능성 높음 — `package.json` 확인 필요)

---

### 6. 반응형 iframe 스타일 추가 [High]

**파일**: `src/styles/prose.css`

**수정 후** (파일 끝에 추가)
```css
/* ── YouTube embed ── */
.prose div[data-youtube-video] {
  margin: 1.5rem 0;
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
}
.prose div[data-youtube-video] iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0.5rem;
}
```

**이유**: `@tiptap/extension-youtube`가 생성하는 `div[data-youtube-video]` 래퍼에 16:9 비율 강제. `aspect-ratio` CSS 속성으로 구현 (IE 지원 불필요한 개인 블로그이므로 padding-hack 대신 사용).

---

### 7. CSP(Content Security Policy) 설정 [High]

**파일**: `next.config.ts`

**현재 코드**
```ts
const nextConfig: NextConfig = {
  /* config options here */
};
```

**수정 후**
```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
              "connect-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**이유**: YouTube iframe이 브라우저 CSP에 의해 차단되지 않도록 `frame-src`에 youtube 도메인 허용. `youtube-nocookie.com`은 `nocookie: true` 옵션 사용 시 생성되는 URL.

> **참고**: 기존 Next.js Image Optimization, API 라우트, 외부 스크립트 등이 있으면 각 지시어 조정 필요. 현재는 빈 설정이므로 기본값으로 작성.

---

## 변경 후 구조

```
src/
├── app/
│   ├── (main)/posts/[slug]/page.tsx       # 변경 없음 (iframe 자동 렌더링)
│   └── admin/posts/new/
│       ├── _actions/
│       │   ├── wysiwyg-editor-action.tsx  # Youtube 확장 추가
│       │   └── editor-toolbar-action.tsx  # Youtube 버튼 + 다이얼로그 추가
│       └── _components/
│           ├── _image-upload/index.tsx    # 변경 없음
│           ├── _link/index.tsx            # 변경 없음
│           └── _youtube/                  # 신규
│               └── index.tsx              # YoutubeEmbedDialog
├── lib/
│   ├── markdown.ts                        # remarkYoutube 플러그인 추가
│   └── remark-youtube.ts                  # 신규 — 커스텀 remark 플러그인
└── styles/
    └── prose.css                          # iframe 반응형 스타일 추가
next.config.ts                             # CSP headers 추가
```

---

## 체크리스트

- [ ] `@tiptap/extension-youtube` 패키지 설치
- [ ] `unist-util-visit` 패키지 설치 여부 확인 (`package.json`)
- [ ] `wysiwyg-editor-action.tsx` — Youtube 확장 등록
- [ ] `_youtube/index.tsx` — YoutubeEmbedDialog 컴포넌트 신규 생성
- [ ] `editor-toolbar-action.tsx` — Youtube 툴바 버튼 + 다이얼로그 연결
- [ ] `remark-youtube.ts` — 커스텀 remark 플러그인 신규 생성
- [ ] `markdown.ts` — remarkYoutube 플러그인 파이프라인 추가
- [ ] `prose.css` — `div[data-youtube-video]` 반응형 스타일 추가
- [ ] `next.config.ts` — CSP `frame-src` 설정
- [ ] 에디터에서 YouTube URL 삽입 동작 확인
- [ ] 글 상세 페이지에서 YouTube 영상 정상 재생 확인
- [ ] 마크다운 모드 `::youtube[VIDEO_ID]` 렌더링 확인
- [ ] 모바일 환경 16:9 반응형 비율 확인

---

## 기타 고려 사항

### DB 스키마 변경 불필요
YouTube embed는 HTML/마크다운 content에 인라인으로 포함되므로 `posts` 테이블 변경 없음.

### lucide-react Youtube 아이콘
lucide-react v0.400+ 이상에서 `Youtube` 아이콘 제공. 없을 경우 `Video` 또는 `Play` 아이콘으로 대체.

### TurndownService (HTML → 마크다운 변환)
WYSIWYG → 마크다운 모드 전환 시 TurndownService가 `div[data-youtube-video]`를 처리하지 못해 빈 블록이 될 수 있음.
필요 시 TurndownService에 커스텀 rule 추가:
```ts
turndown.addRule('youtube', {
  filter: (node) => node.dataset?.youtubeVideo !== undefined,
  replacement: (_, node) => {
    const src = (node as HTMLElement).querySelector('iframe')?.src ?? '';
    const id = src.split('/embed/')[1]?.split('?')[0] ?? '';
    return id ? `\n\n::youtube[${id}]\n\n` : '';
  },
});
```
