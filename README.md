# yjlogs

개인 블로그와 포트폴리오를 담는 pnpm workspace + Turborepo 모노레포.

| 앱         | 경로             | 스택                             | 배포                         |
| ---------- | ---------------- | -------------------------------- | ---------------------------- |
| 블로그     | `apps/web`       | Next.js 16, Drizzle, Neon, Clerk | https://yjlogs.com           |
| 포트폴리오 | `apps/portfolio` | Astro 7, .astro 컴포넌트         | https://portfolio.yjlogs.com |

앱별 상세는 각 폴더의 README를 본다. 규칙과 컨벤션은 `CLAUDE.md`와 `.claude/rules/`에 있다.

## 처음 세팅

1. **pnpm 설치.** 버전은 신경 쓰지 않아도 된다 — 루트 `package.json`의 `packageManager`에 고정돼 있고,
   pnpm이 이 저장소 안에서는 알아서 그 버전으로 전환해 실행한다.

   ```bash
   brew install pnpm
   ```

2. **의존성 설치.** 루트에서 한 번만 한다. 모든 앱이 함께 설치된다.

   ```bash
   pnpm install
   ```

3. **환경변수.** 블로그는 DB·인증 키가 필요하다.

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # 값은 apps/web/README.md의 환경 변수 표를 본다
   ```

4. **개발 서버.**

   ```bash
   pnpm dev --filter web
   ```

> Node 버전은 저장소에서 고정하지 않는다. 개인 프로젝트라 최신 Node를 그대로 쓰고, 배포 시 Node 버전은
> Vercel 프로젝트 설정을 따른다.

## 명령

루트에서 실행한다. `--filter <앱>`을 붙이면 그 앱만 실행하고, 생략하면 모든 앱에 실행한다.

| 명령                                      | 설명                                                      |
| ----------------------------------------- | --------------------------------------------------------- |
| `pnpm dev --filter web`                   | 블로그 개발 서버 (http://localhost:3000)                  |
| `pnpm build`                              | 모든 앱 프로덕션 빌드 (Turborepo 캐시)                    |
| `pnpm build --filter web`                 | 블로그만 빌드                                             |
| `pnpm lint`                               | 모든 앱 ESLint                                            |
| `pnpm test:run`                           | 모든 앱 단위 테스트 1회                                   |
| `pnpm format` / `pnpm format:check`       | 저장소 전체 Prettier                                      |
| `pnpm --filter web test:e2e`              | 블로그 Playwright E2E                                     |
| `pnpm --filter web exec drizzle-kit push` | 스키마 변경을 DB에 반영                                   |
| `pnpm dev --filter portfolio`             | 포트폴리오 개발 서버 (http://localhost:5173)              |
| `pnpm --filter portfolio pdf`             | 포트폴리오 PDF 생성 (`apps/portfolio/dist/portfolio.pdf`) |

앱 폴더 안에서 `pnpm dev`, `pnpm build`처럼 직접 실행해도 된다.

## Vercel

한 저장소에 프로젝트 두 개가 연결되어 있다. 프로젝트마다 Root Directory가 다르고, 그 앱과 무관한 커밋의 빌드는
Vercel 프로젝트 설정의 **Skip deployments**(Build and Deployment → Root Directory)가 건너뛴다. Root Directory와
그 의존성에 변경이 없으면 배포하지 않는 Vercel 네이티브 기능이다.

| Vercel 프로젝트 | Root Directory   | 도메인               |
| --------------- | ---------------- | -------------------- |
| yjlogs          | `apps/web`       | yjlogs.com           |
| portfolio       | `apps/portfolio` | portfolio.yjlogs.com |

Production Branch는 둘 다 `main`. 브랜치 전략은 `CLAUDE.md`를 본다.
