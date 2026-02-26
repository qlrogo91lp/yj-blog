# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured yet.

## Architecture

This is a Next.js 16 blog using the **App Router** with React 19 and TypeScript (strict mode).

- `src/app/` — App Router root. `layout.tsx` is the root layout; `page.tsx` is the homepage.
- `public/` — Static assets served at `/`.
- Styling: **Tailwind CSS v4** via PostCSS. Global styles in `app/globals.css`.
- Fonts: Geist Sans and Geist Mono loaded via `next/font/google` and exposed as CSS variables (`--font-geist-sans`, `--font-geist-mono`).
- Path alias: `@/*` maps to `src/` (e.g. `@/app/...`, `@/components/...`).

New routes are created by adding folders under `src/app/` following Next.js App Router conventions (e.g. `src/app/posts/[slug]/page.tsx`).
