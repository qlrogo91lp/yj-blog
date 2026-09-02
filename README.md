# yjlogs

개인 블로그와 포트폴리오를 담는 pnpm workspace + Turborepo 모노레포.

| 앱         | 경로             | 스택                             | 배포                                |
| ---------- | ---------------- | -------------------------------- | ----------------------------------- |
| 블로그     | `apps/web`       | Next.js 16, Drizzle, Neon, Clerk | https://yjlogs.com                  |
| 포트폴리오 | `apps/portfolio` | Vite, HTML 파티셜                | https://portfolio.yjlogs.com (예정) |

앱별 상세는 각 폴더의 README를 본다. 규칙과 컨벤션은 `CLAUDE.md`와 `.claude/rules/`에 있다.

## 처음 세팅

1. **Node 22.** 루트의 `.nvmrc`를 따른다.

   ```bash
   nvm use
   ```

2. **pnpm 11.** 둘 중 하나로 설치한다. 버전은 루트 `package.json`의 `packageManager`에 고정되어 있다.

   ```bash
   # corepack — Node에 포함. packageManager 값을 읽어 정확한 버전을 받는다
   corepack enable
   pnpm -v

   # 또는 Homebrew
   brew install pnpm
   ```

3. **의존성 설치.** 루트에서 한 번만 한다. 모든 앱이 함께 설치된다.

   ```bash
   pnpm install
   ```

4. **환경변수.** 블로그는 DB·인증 키가 필요하다.

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # 값은 apps/web/README.md의 환경 변수 표를 본다
   ```

5. **개발 서버.**

   ```bash
   pnpm dev --filter web
   ```

## 명령

루트에서 실행한다. `--filter <앱>`을 붙이면 그 앱만 실행하고, 생략하면 모든 앱에 실행한다.

| 명령                                      | 설명                                     |
| ----------------------------------------- | ---------------------------------------- |
| `pnpm dev --filter web`                   | 블로그 개발 서버 (http://localhost:3000) |
| `pnpm build`                              | 모든 앱 프로덕션 빌드 (Turborepo 캐시)   |
| `pnpm build --filter web`                 | 블로그만 빌드                            |
| `pnpm lint`                               | 모든 앱 ESLint                           |
| `pnpm test:run`                           | 모든 앱 단위 테스트 1회                  |
| `pnpm format` / `pnpm format:check`       | 저장소 전체 Prettier                     |
| `pnpm --filter web test:e2e`              | 블로그 Playwright E2E                    |
| `pnpm --filter web exec drizzle-kit push` | 스키마 변경을 DB에 반영                  |

앱 폴더 안에서 `pnpm dev`, `pnpm build`처럼 직접 실행해도 된다.

## Vercel

한 저장소에 프로젝트 두 개가 연결되어 있다. 프로젝트마다 Root Directory가 다르고, `apps/<앱>/vercel.json`의
`ignoreCommand`(`npx turbo-ignore`)가 그 앱과 무관한 커밋의 빌드를 건너뛴다.

| Vercel 프로젝트  | Root Directory   | 도메인               |
| ---------------- | ---------------- | -------------------- |
| yjlogs           | `apps/web`       | yjlogs.com           |
| portfolio (예정) | `apps/portfolio` | portfolio.yjlogs.com |

Production Branch는 둘 다 `main`. 브랜치 전략은 `CLAUDE.md`를 본다.
