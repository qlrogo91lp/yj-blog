# 모노레포 전환 설계

**작성일:** 2026-09-02
**상태:** 결정 완료, 구현 대기
**후속 스펙:** 포트폴리오 앱 (`apps/portfolio`) — 별도 문서로 작성한다

---

## 배경

포트폴리오 페이지를 `portfolio.yjlogs.com`으로 서빙하려 한다. 포트폴리오는 이력서 저장소(`yj-resume`)와 같은
Vite + HTML 파티셜 구조의 정적 문서형 페이지이며, PDF 출력을 전제로 한다. Next.js 앱 안의 라우트로 넣으면 루트
레이아웃(Clerk·GA·테마·Geist 폰트)이 인쇄 결과에 끼어들고 로컬 빌드에 DB 환경변수가 필요해 반복 속도가 떨어진다.
그래서 별도 앱으로 두되, 저장소는 하나로 유지한다.

Vercel은 한 저장소에 프로젝트를 여러 개 연결할 수 있고 프로젝트마다 Root Directory를 따로 지정한다. 그런데
yjlogs의 Root Directory가 저장소 루트인 채로 `portfolio/` 폴더만 추가하면, 포트폴리오만 고친 커밋에도 yjlogs가
빌드된다. "Root Directory 안의 변경이 있을 때만 빌드" 옵션이 yjlogs 쪽에는 먹지 않기 때문이다. 두 앱을 모두
`apps/` 아래 하위 폴더로 두면 이 비대칭이 사라진다.

공유 코드는 아직 없다. 그래도 pnpm workspace와 Turborepo를 지금 넣는다. 비용이 작고, 루트에서 앱을 골라 실행하는
경험과 `turbo-ignore` 기반 배포 스킵을 바로 얻으며, 학습 목적도 있다.

## 결정 사항

### 채택

- `apps/web` (기존 yjlogs) + `apps/portfolio` (후속) 구조
- 패키지 매니저를 npm에서 **pnpm 11**로 전환, `pnpm-workspace.yaml`로 `apps/*` 묶음
- **Turborepo**로 루트 태스크 실행. 원격 캐시는 쓰지 않는다
- Vercel Ignored Build Step은 `npx turbo-ignore`
- 루트 README에 **처음 세팅하는 절차**(pnpm 설치 포함)를 둔다 — 개인 맥북에 pnpm이 없다

### 제외

- `packages/` 공유 패키지 — 공유할 코드가 없다. 필요해질 때 추가한다
- Turborepo 원격 캐시 — 앱 둘, 개발자 하나. 이득이 없다
- Turborepo strict env 모드 — `envMode: "loose"`로 둔다. 로컬 `pnpm build`에서 셸 환경변수가 걸러지는 것을 피한다. Vercel 빌드는 turbo를 거치지 않으므로 영향이 없다
- 포트폴리오 앱 자체 — 이 스펙은 이사와 도구 도입까지만 다룬다
- 이력서 저장소(`yj-resume`) 편입 — 전화번호·주소·사진이 들어 있고 yjlogs는 public이다. private으로 따로 둔다

## 목표 구조

```
yjlogs/
├─ apps/
│  ├─ web/                 기존 yjlogs 전체
│  │  ├─ src/  public/  e2e/
│  │  ├─ next.config.ts  tsconfig.json  eslint.config.mjs
│  │  ├─ vitest.config.ts  playwright.config.ts  drizzle.config.ts
│  │  ├─ postcss.config.mjs  components.json  next.config.test.ts
│  │  ├─ package.json  .env.example  README.md
│  │  └─ vercel.json        ignoreCommand
│  └─ portfolio/           후속 스펙. 이번 작업에서는 만들지 않는다
├─ docs/                   루트 유지
├─ .github/                루트 유지
├─ .claude/                루트 유지. launch.json 수정
├─ CLAUDE.md               루트 유지. 경로·명령 수정
├─ README.md               새로 작성. 구조와 세팅 절차
├─ package.json            루트. private, packageManager, turbo 스크립트
├─ pnpm-workspace.yaml
├─ pnpm-lock.yaml
├─ turbo.json
├─ .prettierrc             루트로 이동
├─ .nvmrc                  22
├─ .prettierignore         새로 작성
└─ .gitignore              루트 통합
```

### 이동 규칙

- 모든 이동은 `git mv`로 한다. 히스토리는 `git log --follow`로 따라간다.
- `.env.local`, `.clerk/`는 git 밖이다. 사용자가 직접 `apps/web/`로 옮긴다. 스펙 실행 시 안내한다.
- `.next/`, `node_modules/`, `tsconfig.tsbuildinfo`, `next-env.d.ts`는 생성물이라 옮기지 않고 지운다.
- `.prettierrc`는 루트로 올려 두 앱이 공유한다. 포맷 규칙이 앱마다 갈릴 이유가 없다.
- `.superpowers/`, `.worktrees/`, `.mcp.json`, `.claude/`는 루트에 남는다.

## pnpm 전환

- 루트 `package.json`에 `"packageManager": "pnpm@11.22.0"`을 적는다. Vercel과 corepack이 이 값으로 버전을 맞춘다.
- `apps/web/package-lock.json`을 삭제하고 루트에서 `pnpm install`을 실행해 `pnpm-lock.yaml`을 만든다.
  `pnpm import`로 npm 락파일을 변환하는 방법도 있으나, 워크스페이스 구조에서는 새로 설치하는 편이 깨끗하다.
- pnpm은 명시하지 않은 의존성을 끌어오지 못한다. 설치 후 `apps/web`에서 `build`·`test:run`·`lint`를 돌려
  숨은 의존성 오류를 찾고, 나오면 `apps/web/package.json`의 `dependencies`에 명시 추가한다. 이 확인 전에는
  문제없다고 단정하지 않는다.
- `.npmrc`는 두지 않는다. 기본 설정으로 시작하고, `shamefully-hoist` 같은 우회는 실제로 막힐 때만 검토한다.

## Turborepo

`turbo.json`:

| 태스크     | dependsOn | outputs                                       | 비고                               |
| ---------- | --------- | --------------------------------------------- | ---------------------------------- |
| `build`    | `^build`  | `.next/**` (`.next/cache/**` 제외), `dist/**` | 캐시                               |
| `dev`      | —         | —                                             | `cache: false`, `persistent: true` |
| `lint`     | —         | —                                             | 캐시                               |
| `test:run` | —         | —                                             | 캐시                               |

루트 `package.json` 스크립트:

```json
{
  "dev": "turbo run dev",
  "build": "turbo run build",
  "lint": "turbo run lint",
  "test:run": "turbo run test:run",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

- 루트 `devDependencies`는 `turbo`, `prettier`, `@trivago/prettier-plugin-sort-imports` 셋이다. `.prettierrc`가 플러그인을 쓰므로 루트에서 resolve되어야 한다. 앱별 도구(eslint, vitest, playwright 등)는 각 앱에 남긴다.
- 앱 하나만 돌릴 때는 `pnpm dev --filter web`. 앱 폴더 안에서 `pnpm dev`를 쳐도 지금과 같다.
- `format`·`format:check`는 turbo 태스크가 아니다. 루트 prettier가 저장소 전체를 훑는다. `.prettierignore`에 `apps/*/.next`,
  `apps/*/dist`, `pnpm-lock.yaml`을 둔다.
- `apps/web/package.json`의 `format`·`format:check` 스크립트는 제거한다. 루트가 담당한다.

## Vercel

### 코드

`apps/web/vercel.json`:

```json
{
  "ignoreCommand": "npx turbo-ignore"
}
```

`turbo-ignore`는 직전 성공 배포 커밋과 비교해 이 앱 또는 이 앱이 의존하는 워크스페이스에 변경이 없으면 종료 코드 0을
내고, Vercel은 그 빌드를 건너뛴다. 포트폴리오만 고친 커밋에는 yjlogs가 배포되지 않는다.

### 대시보드 (사용자가 직접)

yjlogs 프로젝트 설정 → General → Root Directory를 `apps/web`으로 변경한다. 그 외는 그대로다.

- 환경변수: 프로젝트 단위라 변경 없음
- 도메인 `yjlogs.com`: 변경 없음
- Production Branch `main`: 변경 없음
- Framework Preset: Root Directory의 `package.json`을 읽어 Next.js로 자동 인식. 인식이 틀리면 수동으로 Next.js 지정

### GitHub Actions

`.github/workflows/discord-notify.yml`은 `deployment_status` 이벤트만 보고 경로를 보지 않는다. 수정하지 않는다.
포트폴리오 프로젝트가 추가되면 같은 커밋에 배포가 둘 생겨 알림이 두 번 올 수 있다. 메시지에 배포 URL을 넣어
구분하는 수정은 포트폴리오 스펙에서 다룬다.

## 순서와 무중단 전환

Root Directory를 바꾸는 순간부터 옛 구조의 커밋은 Vercel에서 빌드가 깨진다. 반대로 바꾸기 전에는 새 구조의 커밋이
깨진다. 그래서 "PR preview로 확인 → 대시보드 변경 → 같은 날 main 머지" 순서를 지킨다.

1. `develop`에서 `refactor/monorepo` 브랜치 생성
2. 커밋 1 — `git mv`로 `apps/web` 이사. 루트 `.gitignore` 통합
3. 커밋 2 — pnpm 전환. 루트 `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`. `apps/web` 빌드·테스트·lint 통과 확인
4. 커밋 3 — Turborepo. `turbo.json`, 루트 스크립트. `pnpm build`·`pnpm lint`·`pnpm test:run` 루트 통과 확인
5. 커밋 4 — Vercel·문서·툴링. `apps/web/vercel.json`, 루트 README, CLAUDE.md, `.claude/launch.json`
6. PR을 `develop`으로 올린다. **이 시점의 preview 배포는 실패한다.** Root Directory가 아직 저장소 루트다. 예상된 실패다.
7. 대시보드에서 Root Directory를 `apps/web`으로 바꾸고 preview를 재배포한다. 성공을 확인한다.
   이 순간부터 `main`의 옛 구조는 새 preview 배포에서만 깨지고, 이미 배포된 프로덕션은 영향이 없다.
8. `develop`에 머지하고 **같은 날** `main`에 머지한다. 사이에 `main`으로 가는 다른 배포가 있으면 실패한다.
9. `yjlogs.com` 정상 동작과 Discord 알림 수신을 확인한다.

## 문서·툴링 정리

### 루트 README (신규)

다음을 담는다.

- 저장소 구조와 각 앱의 역할, 배포 주소
- **처음 세팅**
  1. Node 22 — 루트에 `.nvmrc`(`22`)를 두고 `nvm use`로 맞춘다
  2. pnpm 설치 — 두 가지 중 하나
     - `corepack enable` 후 저장소에서 아무 `pnpm` 명령 실행 → `packageManager` 값으로 자동 설치
     - `brew install pnpm`
  3. `pnpm install` (루트)
  4. `apps/web/.env.example`을 복사해 `apps/web/.env.local` 작성
  5. `pnpm dev --filter web`
- 자주 쓰는 명령 표 (루트 기준, `--filter` 예시 포함)
- Vercel 프로젝트 구성 요약 (프로젝트별 Root Directory, ignoreCommand)

### CLAUDE.md

- 명령어 절을 루트 pnpm 기준으로 바꾼다 (`pnpm dev --filter web` 등)
- "저장소 구조" 절을 추가한다. `apps/web`이 블로그이고 규칙 문서의 `src/` 경로는 `apps/web/src/`를 뜻한다고 적는다
- 브랜치 전략·문서 규칙은 그대로다

### `apps/web/README.md`

기존 README를 그대로 옮긴다. 환경 변수 표와 브랜치 전략은 여기 남긴다. 세팅 절차만 루트를 가리키게 한 줄 고친다.

### `.claude/launch.json`

`dev`의 `runtimeExecutable`을 `pnpm`, `runtimeArgs`를 `["--filter", "web", "dev"]`로 바꾼다. `prod`도 같은 방식.

### `.claude/rules/*.md`

경로가 `src/...`로 적혀 있다. 규칙 문서는 `apps/web` 안의 상대 경로로 읽는다는 한 줄을 CLAUDE.md에 두고, 규칙 문서
자체는 고치지 않는다. 히스토리 문서를 수정하지 않는 원칙과도 맞는다.

## 검증 기준

| 항목           | 기준                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| 루트 명령      | `pnpm build`, `pnpm lint`, `pnpm test:run`, `pnpm format:check` 모두 통과       |
| 앱 단독        | `apps/web`에서 `pnpm dev`로 로컬 3000 포트 정상                                 |
| E2E            | `apps/web`에서 `pnpm test:e2e` 통과 (webServer 명령이 `pnpm dev`로 바뀌어야 함) |
| Vercel preview | Root Directory 변경 후 PR preview 성공                                          |
| 프로덕션       | `main` 머지 후 `yjlogs.com` 정상, Discord 알림 수신                             |
| 히스토리       | `git log --follow apps/web/src/app/layout.tsx`가 이사 전 커밋까지 이어짐        |

## 리스크

- **pnpm 엄격 모드로 숨은 의존성이 드러남.** 명시 추가로 해결. 해결이 안 되는 패키지가 나오면 그때 `.npmrc`
  `public-hoist-pattern`을 최소 범위로 검토한다.
- **Root Directory 변경과 main 머지 사이의 공백.** 같은 날 처리하고, 그 사이 `main`에 다른 커밋을 올리지 않는다.
- **Playwright webServer 명령.** `npm run dev`가 하드코딩되어 있어 `pnpm dev`로 바꿔야 한다. 커밋 2에 포함한다.
- **`.claude/settings.local.json`의 허용 목록.** `npm run:*` 같은 항목이 있으나 로컬 설정이라 동작에는 영향 없다.
  필요 시 사용자가 `pnpm:*`를 추가한다.
