# 모노레포 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** yjlogs 저장소를 `apps/web`(기존 블로그) + 후속 `apps/portfolio`를 담을 pnpm workspace + Turborepo 모노레포로 전환하고, Vercel 배포를 끊김 없이 새 루트로 옮긴다.

**Architecture:** 기존 코드는 `git mv`로 `apps/web`에 통째로 옮기고 내용은 건드리지 않는다. 루트에는 workspace 설정, Turborepo 설정, 공유 Prettier 설정, README만 둔다. Vercel은 프로젝트 Root Directory를 `apps/web`으로 바꾸고 `turbo-ignore`로 무관한 커밋의 빌드를 건너뛴다.

**Tech Stack:** pnpm 11.22.0 workspace, Turborepo 2, Node 22, Next.js 16 (apps/web), Vercel

**Spec:** `docs/superpowers/specs/2026-09-02-monorepo-migration-design.md`

## Global Constraints

- 패키지 매니저: `"packageManager": "pnpm@11.22.0"` (루트 package.json)
- Node: 22 (`.nvmrc`)
- 워크스페이스: `apps/*`만. `packages/`는 만들지 않는다
- 루트 devDependencies는 `turbo`, `prettier`, `@trivago/prettier-plugin-sort-imports` 셋뿐
- Turborepo `envMode: "loose"`, 원격 캐시 없음
- 모든 파일 이동은 `git mv` (히스토리 보존)
- 커밋 메시지는 gitmoji prefix. squash 머지 금지, `--no-ff`
- 브랜치: `develop` → `refactor/monorepo` → PR to `develop` → 같은 날 `main` 머지
- `.claude/rules/*.md`와 `docs/` 아래 기존 문서는 수정하지 않는다
- 앱 소스 코드(`src/`, `e2e/`)의 내용은 바꾸지 않는다. 바꾸는 파일은 설정·문서뿐이다

---

## 사전 확인

실행 전 다음이 맞는지 확인한다. 하나라도 다르면 멈추고 사용자에게 알린다.

```bash
cd /Users/yj/Workspace/yjlogs
git branch --show-current        # develop
git status --short               # 비어 있어야 함
pnpm -v                          # 11.22.0
node -v                          # v22.x
gh auth status                   # 로그인 상태
```

## File Structure

| 경로                            | 처리             | 책임                                            |
| ------------------------------- | ---------------- | ----------------------------------------------- |
| `apps/web/**`                   | `git mv`         | 기존 블로그 앱 전체. 내용 불변                  |
| `apps/web/package.json`         | 수정             | name을 `web`으로, format 스크립트·prettier 제거 |
| `apps/web/playwright.config.ts` | 수정             | webServer 명령 `pnpm dev`                       |
| `apps/web/vercel.json`          | 생성             | `ignoreCommand`                                 |
| `apps/web/README.md`            | `git mv` 후 수정 | 세팅 절차를 루트로 안내                         |
| `package.json` (루트)           | 생성             | workspace 루트, turbo 스크립트                  |
| `pnpm-workspace.yaml`           | 생성             | `apps/*`                                        |
| `pnpm-lock.yaml`                | 생성             | `pnpm install` 결과                             |
| `turbo.json`                    | 생성             | 태스크 파이프라인                               |
| `.nvmrc`                        | 생성             | `22`                                            |
| `.prettierrc`                   | 유지             | 공유 포맷 규칙                                  |
| `.prettierignore`               | 생성             | 생성물·락파일 제외                              |
| `.gitignore`                    | 수정             | 앱 하위 경로에 맞게 패턴 통합                   |
| `README.md` (루트)              | 생성             | 구조·세팅·명령·Vercel 요약                      |
| `CLAUDE.md`                     | 수정             | 명령어·저장소 구조 절                           |
| `.claude/launch.json`           | 수정             | pnpm filter 명령                                |

---

### Task 1: `apps/web`으로 이사

**Files:**

- Move: `src`, `public`, `e2e`, `next.config.ts`, `next.config.test.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `drizzle.config.ts`, `postcss.config.mjs`, `components.json`, `package.json`, `package-lock.json`, `.env.example`, `README.md` → `apps/web/`
- Modify: `.gitignore`
- Local only (git 밖): `.env.local`, `.clerk/` → `apps/web/`

**Interfaces:**

- Produces: `apps/web/` 디렉터리. 이후 모든 태스크는 앱을 이 경로로 참조한다.

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/yj/Workspace/yjlogs
git checkout develop && git pull --ff-only origin develop
git checkout -b refactor/monorepo
```

- [ ] **Step 2: 생성물 제거**

git이 추적하지 않는 빌드 산출물은 옮기지 않고 지운다.

```bash
rm -rf .next node_modules tsconfig.tsbuildinfo next-env.d.ts
```

- [ ] **Step 3: 추적 파일 `git mv`**

```bash
mkdir -p apps/web
git mv src public e2e \
  next.config.ts next.config.test.ts tsconfig.json eslint.config.mjs \
  vitest.config.ts playwright.config.ts drizzle.config.ts postcss.config.mjs \
  components.json package.json package-lock.json .env.example README.md \
  apps/web/
```

- [ ] **Step 4: 이동 결과 확인**

```bash
git status --short | grep -v '^R' ; echo "--- 위에 R 외 항목이 없어야 함 ---"
ls apps/web
ls   # 루트에는 .claude .github .gitignore .mcp.json .prettierrc CLAUDE.md docs apps 만 남아야 함
```

Expected: `git status --short`의 모든 줄이 `R`(rename)로 시작한다. 루트에 소스 파일이 남아 있지 않다.

- [ ] **Step 5: git 밖 로컬 파일 이동**

```bash
mv .env.local apps/web/.env.local
mv .clerk apps/web/.clerk
ls -a apps/web | grep -E '^\.env\.local$|^\.clerk$'
```

Expected: 두 항목이 출력된다.

- [ ] **Step 6: 루트 `.gitignore` 통합**

앱이 하위 폴더로 내려가므로 `/`로 시작하던 앵커 패턴을 경로 무관 패턴으로 바꾸고, `dist/`와 `.turbo/`를 추가한다. 파일 전체를 아래 내용으로 교체한다.

```gitignore
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# Superpowers brainstorm sessions
.superpowers/

# dependencies
node_modules/
.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
coverage/
test-results/
playwright-report/
playwright/.cache/

# next.js
.next/
out/

# vite
dist/

# turborepo
.turbo/

# production
build/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*
!.env.example

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# clerk configuration (can include secrets)
.clerk/

# git worktrees
.worktrees/
```

- [ ] **Step 7: ignore 동작 확인**

```bash
git check-ignore -v apps/web/.env.local apps/web/.clerk/x apps/web/.next/x apps/web/node_modules/x apps/portfolio/dist/x
git status --short | grep -v '^R' ; echo "--- .gitignore 외 항목이 없어야 함 ---"
```

Expected: 다섯 경로 모두 무시 규칙에 걸린다. `git status`에 `.gitignore` 수정(`M`)과 rename만 보인다.

- [ ] **Step 8: 이사 후에도 앱이 빌드되는지 확인 (npm 기준, 마지막)**

pnpm 전환 전에 이동 자체로 깨진 것이 없는지 분리해서 확인한다.

```bash
cd apps/web && npm ci && npm run build 2>&1 | tail -15 && cd ../..
```

Expected: `✓ Compiled successfully` 등 정상 빌드 로그. 실패하면 이동 누락 파일이 있는 것이니 Step 3 목록과 `ls apps/web`을 대조한다.

- [ ] **Step 9: 히스토리 추적 확인**

```bash
git log --follow --oneline apps/web/src/app/layout.tsx | tail -3
```

Expected: 이사 이전 커밋들이 출력된다.

- [ ] **Step 10: 커밋**

```bash
git add -A
git status --short | grep -v '^R' ; echo "--- .gitignore(M) 하나만 있어야 함 ---"
git commit -m "♻️ refactor: 블로그 앱을 apps/web으로 이동

모노레포 전환 1단계. 파일 내용은 바꾸지 않고 git mv로만 옮긴다.
루트 .gitignore는 앱이 하위 폴더에 있어도 걸리도록 앵커 패턴을 푼다."
```

---

### Task 2: pnpm workspace 전환

**Files:**

- Create: `package.json` (루트), `pnpm-workspace.yaml`, `.nvmrc`, `.prettierignore`
- Modify: `apps/web/package.json`, `apps/web/playwright.config.ts`
- Delete: `apps/web/package-lock.json`, `apps/web/node_modules`
- Generated: `pnpm-lock.yaml`

**Interfaces:**

- Produces: 워크스페이스 패키지 이름 `web`. 이후 `pnpm --filter web <script>`로 호출한다.

- [ ] **Step 1: 루트 `package.json` 생성**

turbo 스크립트는 Task 3에서 추가한다. 여기서는 워크스페이스와 포맷만 둔다.

```json
{
  "name": "yjlogs",
  "private": true,
  "packageManager": "pnpm@11.22.0",
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {
    "@trivago/prettier-plugin-sort-imports": "^6.0.2",
    "prettier": "^3.8.1"
  }
}
```

- [ ] **Step 2: `pnpm-workspace.yaml`, `.nvmrc` 생성**

`pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
```

`.nvmrc`:

```
22
```

- [ ] **Step 3: `.prettierignore` 생성**

```
node_modules
pnpm-lock.yaml
apps/*/.next
apps/*/dist
apps/*/test-results
apps/*/playwright-report
.turbo
docs/legacy
```

- [ ] **Step 4: `apps/web/package.json` 수정**

세 군데를 바꾼다. 나머지 의존성 목록은 그대로 둔다.

1. `"name": "yj-blog"` → `"name": "web"`
2. `scripts`에서 `"format"`과 `"format:check"` 두 줄 삭제
3. `devDependencies`에서 `"@trivago/prettier-plugin-sort-imports"`와 `"prettier"` 두 줄 삭제

수정 후 `scripts` 블록은 다음과 같아야 한다.

```json
  "scripts": {
    "dev": "next dev",
    "dev:clean": "rm -rf .next && next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test"
  },
```

- [ ] **Step 5: Playwright webServer 명령 수정**

`apps/web/playwright.config.ts`의 `webServer.command`를 바꾼다.

```ts
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/apps/ralli',
    reuseExistingServer: !process.env.CI,
  },
```

- [ ] **Step 6: npm 산출물 제거 후 pnpm 설치**

```bash
git rm -q apps/web/package-lock.json
rm -rf apps/web/node_modules
pnpm install 2>&1 | tail -20
```

Expected: 루트에 `pnpm-lock.yaml`과 `node_modules/`가 생기고, `apps/web/node_modules/`에 심링크 구조가 생긴다. peer dependency 경고는 무시해도 된다. `ERR_PNPM_*`가 나오면 멈추고 메시지를 보고한다.

- [ ] **Step 7: 워크스페이스 인식 확인**

```bash
pnpm -r ls --depth -1 2>/dev/null | grep -E '^(web|yjlogs)'
```

Expected: `web` 패키지가 `apps/web`에 잡힌다.

- [ ] **Step 8: 앱 빌드·테스트·lint로 숨은 의존성 확인**

pnpm은 `package.json`에 없는 패키지를 못 찾는다. 세 명령을 차례로 돌린다.

```bash
pnpm --filter web build 2>&1 | tail -20
pnpm --filter web test:run 2>&1 | tail -15
pnpm --filter web lint 2>&1 | tail -15
```

Expected: 셋 다 통과. `Cannot find module 'xxx'` 또는 `Module not found: Can't resolve 'xxx'`가 나오면 그 패키지를 `apps/web`에 명시 추가하고 다시 돌린다.

```bash
pnpm --filter web add <패키지명>          # 런타임 의존이면
pnpm --filter web add -D <패키지명>       # 빌드·테스트 도구면
```

추가한 패키지는 커밋 메시지 본문에 적는다.

- [ ] **Step 9: 루트 Prettier 동작 확인**

플러그인이 루트에서 resolve되는지 본다.

```bash
pnpm format:check 2>&1 | tail -5
```

Expected: `All matched files use Prettier code style!` 또는 기존에 포맷이 안 맞던 파일 목록. `Cannot find package '@trivago/prettier-plugin-sort-imports'`가 나오면 Step 1의 devDependencies를 다시 확인한다. 기존 파일이 포맷에 안 맞아 실패하면 `pnpm format`을 한 번 돌리고 그 변경도 이 커밋에 포함한다.

- [ ] **Step 10: 커밋**

```bash
git add -A
git status --short
git commit -m "🔧 chore: npm → pnpm workspace 전환

루트 package.json에 packageManager를 고정하고 apps/*를 워크스페이스로 묶는다.
Prettier는 루트가 담당하므로 apps/web의 format 스크립트와 의존성을 제거한다.
Playwright webServer 명령을 pnpm dev로 바꾼다."
```

(Step 8에서 명시 추가한 패키지가 있으면 본문에 `숨은 의존성 명시 추가: xxx, yyy` 한 줄을 덧붙인다.)

---

### Task 3: Turborepo 도입

**Files:**

- Create: `turbo.json`
- Modify: `package.json` (루트)

**Interfaces:**

- Produces: 루트 스크립트 `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test:run`. 앱 선택은 `--filter web`.

- [ ] **Step 1: turbo 설치**

```bash
pnpm add -Dw turbo 2>&1 | tail -3
grep '"turbo"' package.json
```

Expected: 루트 `devDependencies`에 `turbo` 항목이 생긴다.

- [ ] **Step 2: `turbo.json` 생성**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "envMode": "loose",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test:run": {}
  }
}
```

`envMode: "loose"`는 셸 환경변수를 태스크에 그대로 넘긴다. strict가 기본값이라 빠뜨리면 로컬 `pnpm build`에서 선언하지 않은 변수가 걸러진다.

- [ ] **Step 3: 루트 스크립트 추가**

루트 `package.json`의 `scripts`를 다음으로 교체한다.

```json
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test:run": "turbo run test:run",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
```

- [ ] **Step 4: 루트에서 세 태스크 실행**

```bash
pnpm build 2>&1 | tail -10
pnpm lint 2>&1 | tail -5
pnpm test:run 2>&1 | tail -8
```

Expected: 각각 `Tasks: 1 successful, 1 total`로 끝난다.

- [ ] **Step 5: 캐시 동작 확인**

```bash
pnpm build 2>&1 | grep -E 'FULL TURBO|cache hit'
```

Expected: `>>> FULL TURBO` 또는 `cache hit, replaying logs`가 보인다. 입력이 안 바뀌었으니 두 번째 빌드는 캐시에서 나와야 한다.

- [ ] **Step 6: 필터 실행 확인**

```bash
pnpm dev --filter web &
sleep 8
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/
kill %1
```

Expected: `200`. (다른 서버가 3000을 쓰고 있으면 먼저 내린다.)

- [ ] **Step 7: 커밋**

```bash
git add -A
git status --short
git commit -m "🔧 chore: Turborepo 도입

build/dev/lint/test:run 태스크를 루트에서 실행한다. build 출력은 캐시하고
dev는 persistent로 둔다. envMode는 loose."
```

---

### Task 4: Vercel 설정·문서·툴링

**Files:**

- Create: `apps/web/vercel.json`, `README.md` (루트)
- Modify: `apps/web/README.md`, `CLAUDE.md`, `.claude/launch.json`

**Interfaces:**

- Consumes: Task 3의 루트 스크립트 이름(`dev`, `build`, `lint`, `test:run`)과 패키지 이름 `web`.

- [ ] **Step 1: `apps/web/vercel.json` 생성**

```json
{
  "ignoreCommand": "npx turbo-ignore"
}
```

- [ ] **Step 2: 루트 `README.md` 생성**

````markdown
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
````

- [ ] **Step 3: `apps/web/README.md` 명령어 절 수정**

`## 명령어` 절의 코드 블록을 다음으로 교체한다. 나머지 절은 그대로 둔다.

````markdown
## 명령어

의존성 설치와 pnpm 세팅은 저장소 루트 `README.md`의 "처음 세팅"을 따른다. 아래는 이 폴더(`apps/web`) 안에서 실행하는 기준이다.

```bash
pnpm dev         # 개발 서버 (http://localhost:3000)
pnpm build       # 프로덕션 빌드
pnpm lint        # ESLint

# 테스트
pnpm test        # Vitest 단위/통합 테스트 (watch 모드)
pnpm test:run    # Vitest 1회 실행 (CI용)
pnpm test:e2e    # Playwright E2E 테스트

# DB
pnpm exec drizzle-kit push    # schema.ts 변경 후 DB에 바로 반영
pnpm exec drizzle-kit studio  # DB 데이터 GUI로 확인
```
````

- [ ] **Step 4: `CLAUDE.md` 명령어 절 수정**

`## 명령어` 아래 첫 코드 블록(`npm run dev` … `npm run format`)을 다음으로 교체한다.

````markdown
## 명령어

저장소 루트에서 실행한다. 블로그 앱은 워크스페이스 이름 `web`이다.

```bash
pnpm dev --filter web    # 개발 서버 실행 (http://localhost:3000)
pnpm build               # 프로덕션 빌드 (모든 앱, Turborepo 캐시)
pnpm lint                # ESLint 실행 (모든 앱)
pnpm format              # Prettier 포맷팅 (저장소 전체)
```
````

같은 절의 DB 명령 블록도 바꾼다.

```bash
pnpm --filter web exec drizzle-kit push    # schema.ts 변경 후 DB에 바로 반영
pnpm --filter web exec drizzle-kit studio  # DB 데이터 GUI로 확인
```

테스트 블록도 바꾼다.

```bash
pnpm --filter web test        # Vitest 단위/통합 테스트 (watch 모드)
pnpm test:run                 # Vitest 1회 실행 (CI용)
pnpm --filter web test:e2e    # Playwright E2E 테스트
```

- [ ] **Step 5: `CLAUDE.md`에 저장소 구조 절 추가**

`## 아키텍처` 절 바로 앞에 다음 절을 넣는다.

```markdown
## 저장소 구조

pnpm workspace + Turborepo 모노레포다. 앱은 `apps/` 아래에 있고 공유 패키지는 아직 없다.

- `apps/web/` — 블로그 (Next.js). 이 문서와 `.claude/rules/*.md`에 적힌 `src/`, `public/`, `e2e/` 경로는 모두 `apps/web/` 기준이다.
- `apps/portfolio/` — 포트폴리오 (Vite). 별도 스펙으로 추가한다.
- `docs/`, `.claude/`, `.github/` — 루트. 앱과 무관하게 저장소 전체를 다룬다.
- 루트 `package.json`은 워크스페이스 설정과 turbo 스크립트만 갖는다. 앱 의존성은 각 앱의 `package.json`에 둔다.

Vercel은 프로젝트별 Root Directory(`apps/web`, `apps/portfolio`)로 연결되어 있고, 각 앱의 `vercel.json`
`ignoreCommand`(`npx turbo-ignore`)가 무관한 커밋의 빌드를 건너뛴다.
```

- [ ] **Step 6: `.claude/launch.json` 수정**

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "dev",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "web", "dev"],
      "port": 3000
    },
    {
      "name": "prod",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "web", "exec", "next", "start", "-p", "3100"],
      "port": 3100
    }
  ]
}
```

- [ ] **Step 7: 포맷 확인**

```bash
pnpm format:check 2>&1 | tail -5
```

Expected: 통과. 실패하면 `pnpm format` 후 변경을 이 커밋에 포함한다.

- [ ] **Step 8: 커밋**

```bash
git add -A
git status --short
git commit -m "📝 docs: 모노레포 구조 문서와 Vercel ignoreCommand 추가

루트 README에 세팅 절차(pnpm 설치 포함)와 명령 표를 둔다. CLAUDE.md의 명령을
pnpm 기준으로 바꾸고 저장소 구조 절을 추가한다. apps/web/vercel.json에
turbo-ignore를 둬 무관한 커밋의 빌드를 건너뛴다."
```

---

### Task 5: PR, Vercel Root Directory 전환, 머지

이 태스크는 사용자가 Vercel 대시보드에서 직접 해야 하는 단계가 있다. 그 지점에서 멈추고 확인을 받는다.

**Files:** 없음 (git·Vercel 작업)

- [ ] **Step 1: 푸시 및 PR 생성**

```bash
git push -u origin refactor/monorepo
gh pr create --base develop --title "♻️ 모노레포 전환: apps/web + pnpm + Turborepo" --body "$(cat <<'EOF'
## 요약

- 블로그 앱을 `apps/web`으로 이동 (git mv, 히스토리 보존)
- npm → pnpm workspace, Turborepo 도입
- `apps/web/vercel.json`에 `turbo-ignore`
- 루트 README(세팅 절차), CLAUDE.md, launch.json 갱신

스펙: `docs/superpowers/specs/2026-09-02-monorepo-migration-design.md`

## 머지 전 확인

- [ ] Vercel yjlogs 프로젝트 Root Directory를 `apps/web`으로 변경
- [ ] 변경 후 preview 재배포 성공
- [ ] develop 머지 후 같은 날 main 머지

## 예상된 실패

첫 preview 배포는 Root Directory가 아직 저장소 루트라 실패한다. 위 확인 항목 처리 후 재배포한다.
EOF
)"
```

- [ ] **Step 2: 첫 preview 실패 확인**

PR 페이지의 Vercel 체크가 실패하는지 본다. `package.json`을 못 찾거나 Next.js를 인식하지 못하는 오류여야 한다. 다른 종류의 오류면 멈추고 보고한다.

- [ ] **Step 3: 사용자 작업 — Root Directory 변경**

여기서 멈추고 사용자에게 요청한다.

> Vercel 대시보드 → yjlogs 프로젝트 → Settings → General → Root Directory에 `apps/web` 입력 후 Save. 그다음 PR의 Vercel 체크에서 Redeploy.

사용자가 완료를 알리기 전에는 다음 단계로 가지 않는다.

- [ ] **Step 4: preview 성공 확인**

```bash
gh pr checks refactor/monorepo
```

Expected: Vercel 체크가 `pass`. preview URL을 열어 홈이 렌더되는지 사용자가 확인한다.

- [ ] **Step 5: develop 머지**

```bash
gh pr merge refactor/monorepo --merge --delete-branch
git checkout develop && git pull --ff-only origin develop
```

- [ ] **Step 6: main 머지 (같은 날)**

```bash
git checkout main && git pull --ff-only origin main
git merge --no-ff develop -m "🔀 merge: develop → main (모노레포 전환)"
git push origin main
git checkout develop
```

- [ ] **Step 7: 프로덕션 확인**

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://yjlogs.com/
curl -s -o /dev/null -w '%{http_code}\n' https://yjlogs.com/sitemap.xml
```

Expected: 둘 다 `200`. Discord 채널에 배포 성공 알림이 왔는지 사용자가 확인한다.

- [ ] **Step 8: 로컬 정리**

```bash
git branch -d refactor/monorepo 2>/dev/null; git worktree prune
rm -rf /Users/yj/Workspace/yjlogs/node_modules/.cache 2>/dev/null; echo ok
```

- [ ] **Step 9: 플랜 문서 완료 표시**

이 문서 상단 제목 아래에 완료 일자와 결과 요약을 한 단락 추가하고 `develop`에 커밋한다.

```bash
git add docs/superpowers/plans/2026-09-02-monorepo-migration.md
git commit -m "📝 docs: 모노레포 전환 플랜 완료 기록"
git push origin develop
```

---

## Self-Review 결과

**스펙 커버리지.** 목표 구조(Task 1), 이동 규칙(Task 1 Step 3·5), pnpm 전환(Task 2), Turborepo(Task 3), Vercel 코드·대시보드(Task 4 Step 1, Task 5 Step 3), 순서와 무중단 전환(Task 5), 루트 README·CLAUDE.md·apps/web README·launch.json(Task 4), 검증 기준의 각 항목(Task 2 Step 8, Task 3 Step 4·6, Task 5 Step 4·7, Task 1 Step 9), 리스크의 Playwright 명령(Task 2 Step 5)까지 대응한다. `.claude/rules/`는 수정하지 않고 CLAUDE.md에 기준 경로 한 줄(Task 4 Step 5)로 처리한다.

**이름 일관성.** 워크스페이스 이름 `web`은 Task 2 Step 4에서 정하고 Task 3·4·5가 `--filter web`으로 쓴다. 루트 스크립트 이름 `dev`·`build`·`lint`·`test:run`은 Task 3 Step 3에서 정하고 Task 4의 README·CLAUDE.md가 같은 이름을 쓴다.
