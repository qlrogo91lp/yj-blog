# 배포 환경 페이지 전환 성능 개선 Implementation Plan

> **완료: 2026-08-10.** Task 1~5 전부 구현·리뷰·커밋 완료. 최종 브랜치 리뷰에서 Important 2건(R2 업로드 키 충돌로 인한 immutable 캐시 무효화 불가, `/api/:path*` matcher 과다 범위)을 발견해 수정 후 재검증까지 마쳤다(commit `7278667`). Task 5는 React 19 타이밍·lint 이슈로 플랜 원안 코드에서 2건 편차가 있었고, 사람 검토 후 구현체를 최종안으로 채택해 Step 4 코드 블록을 갱신했다(commit `7081831`). 배포 전/후 사람이 직접 확인해야 할 항목은 하단 "배포 후 검증" 및 각 태스크의 결과 메모 참고. 브랜치: `fix/deploy-navigation-perf`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개 페이지 전환의 상시 오버헤드(Clerk 미들웨어 ~85ms)를 제거하고, 이미지 콜드 스타트 노출 빈도를 낮추며, 남는 대기 구간에 깜빡임 없는 프로그레스 바를 제공한다.

**Architecture:** 설계 문서 [`2026-08-10-deploy-navigation-perf-design.md`](../specs/2026-08-10-deploy-navigation-perf-design.md)를 따른다. 네 개의 독립적인 변경(미들웨어 matcher 축소 · CSP 도메인 허용 · 이미지 캐시 정책 · 프로그레스 바)으로 구성되며 서로 의존하지 않는다. `loading.tsx`는 선행 문서의 soft 404 결론에 따라 도입하지 않고, Suspense 경계를 만들지 않는 순수 클라이언트 컴포넌트로 로딩 피드백을 준다.

**Tech Stack:** Next.js 16.1.6 (App Router), React 19.2.3, TypeScript strict, Tailwind CSS v4, Vitest 4 + @testing-library/react 16, Clerk, Cloudflare R2 (`@aws-sdk/client-s3`), `@tanem/react-nprogress` (신규)

## Global Constraints

모든 태스크의 요구사항에 아래가 암묵적으로 포함된다.

- **Tailwind v4 문법 사용** — `max-w-[var(--x)]` ❌ → `max-w-(--x)` ✅ / `bg-gradient-to-*` ❌ → `bg-linear-to-*` ✅ / `aspect-[980/362]` ❌ → `aspect-980/362` ✅. 구문법도 경고 없이 컴파일되므로 자동 검출되지 않는다 (`.claude/rules/coding-conventions.md`).
- **커밋 메시지는 gitmoji 사용** (`:feat:`·`:fix:` 접미사 대신). 예: `⚡️`, `🐛`, `✨`, `📝`
- **컴포넌트 규칙** — 파일명 kebab-case, 함수명 PascalCase, props 타입은 `type Props = {}`, 조건부 클래스는 `cn()`
- **Import 규칙** — React hook은 named import (`import { useState } from 'react'`). `React.useState`·`import * as React` 금지
- **정확한 상수값** (설계 문서에서 그대로 옮김)
  - `images.minimumCacheTTL`: `31536000`
  - `images.deviceSizes`: `[640, 828, 1080, 1920]`
  - R2 업로드 `CacheControl`: `'public, max-age=31536000, immutable'`
  - 프로그레스 바 지연 노출: `150`ms
- **`imageSizes`는 변경하지 않는다** (설계 문서 3.2 명시)
- **`loading.tsx`를 만들지 않는다** (soft 404 유발)
- 각 태스크 종료 시 `npm run lint` 0 errors 유지

## 시작 전: 브랜치 생성

스펙 문서는 이미 `develop`에 커밋되어 있다(`5ed7ebc`). 여기서부터는 구현 코드이므로 브랜치를 만든다.

```bash
git checkout develop
git pull
git checkout -b fix/deploy-navigation-perf
```

## File Structure

| 파일                                                     | 상태 | 책임                                                                                                |
| -------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------- |
| `src/proxy.ts`                                           | 수정 | Clerk 미들웨어 적용 범위. `/admin`·`/api`로 한정                                                    |
| `next.config.ts`                                         | 수정 | CSP 헤더(GA 도메인 허용) + 이미지 캐시 정책                                                         |
| `next.config.test.ts`                                    | 신규 | 위 두 설정의 회귀 방지. GA CSP 누락은 실제로 배포되어 수개월간 방치된 이력이 있어 테스트로 고정한다 |
| `src/app/admin/posts/new/_services/upload-image.ts`      | 수정 | R2 업로드 시 `CacheControl` 부여                                                                    |
| `src/app/admin/posts/new/_services/upload-image.test.ts` | 신규 | 업로드가 `CacheControl`을 싣는지 검증                                                               |
| `src/components/navigation-progress.tsx`                 | 신규 | 네비게이션 감지 + 상단 프로그레스 바. 순수 클라이언트, Suspense 경계 없음                           |
| `src/components/navigation-progress.test.tsx`            | 신규 | 감지 제외 조건과 지연 노출 검증                                                                     |
| `src/app/layout.tsx`                                     | 수정 | `<NavigationProgress />` 배치                                                                       |

`navigation-progress.tsx`는 `src/components/` 직하의 공통 클라이언트 컴포넌트이므로 `page-tracker.tsx`·`nav-links.tsx`와 동일하게 접미사 없는 kebab-case를 쓴다. `_actions/*.action.tsx` 규칙은 라우트 폴더 전용이라 해당 없음.

---

### Task 1: Clerk 미들웨어 범위 축소

**Files:**

- Modify: `src/proxy.ts`

**Interfaces:**

- Consumes: 없음
- Produces: 없음 (설정 변경). 다른 태스크가 이 결과에 의존하지 않는다.

> **왜 단위 테스트가 없는가**: matcher는 Next.js 내부 경로 매칭 엔진이 해석한다. 이를 테스트에서 재현하려면 Next의 매칭 구현을 복제해야 하고, 그 테스트는 실제 동작이 아니라 우리가 만든 모조품을 검증하게 된다. 대신 **빌드 산출물과 프로덕션 응답 헤더**로 검증한다 — 이쪽이 실제 동작을 직접 관측한다.

- [x] **Step 1: 변경 전 기준값 측정 (Before)**

배포된 프로덕션에서 현재 값을 기록해 둔다. 나중에 개선을 증명할 근거다.

```bash
curl -sI https://yjlogs.com/posts/dell-s2725qc -H "RSC: 1" | grep -iE "^(x-clerk-auth-status|x-vercel-cache)"
for i in 1 2 3; do curl -so /dev/null -w "%{time_total}\n" https://yjlogs.com/ -H "RSC: 1"; done
```

기대: `x-clerk-auth-status: signed-out`이 **존재**하고, 시간이 **0.10초 내외**.

- [x] **Step 2: matcher 축소**

`src/proxy.ts` 전체를 아래로 교체한다.

```ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

/**
 * Clerk를 인증이 실제로 필요한 경로에만 적용한다.
 *
 * 공개 라우트(`/`, `/posts/*`, `/tags` 등)는 `auth()`를 호출하지 않고,
 * 공개 Server Action(addComment·removeComment)도 bcrypt 비밀번호 방식이라
 * Clerk와 무관하다. 전역 적용 시 CDN 캐시가 HIT여도 요청당 ~85ms가 붙는다.
 *
 * `/api`를 포함하는 이유: `api/track`이 관리자 본인의 방문을 집계에서
 * 제외하기 위해 `auth()`를 사용한다.
 */
export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
```

- [x] **Step 3: 빌드로 미들웨어 적용 범위 확인**

```bash
npm run build
```

기대: 빌드 성공. 라우트 표에서 `(main)` 그룹 라우트들이 기존과 동일하게 `○`/`●`로 유지된다(미들웨어 축소가 정적 판정을 되돌리지 않아야 한다).

- [x] **Step 4: 로컬 프로덕션 서버로 인증 회귀 확인** (curl 기반 항목만 검증. 로그인·로그아웃·저장 등 실제 자격증명이 필요한 1~6 중 2·4·5는 사람이 배포 전 직접 확인 필요 — task-1-report.md 참고)

```bash
npx next start
```

브라우저에서 순서대로 확인한다.

1. `http://localhost:3000` 접속 → 헤더에 로그인 버튼 표시
2. 로그인(모달) → 헤더에 대시보드 버튼 표시
3. `/admin` 진입 → 대시보드 정상 렌더 (리다이렉트되지 않음)
4. 글 목록에서 아무 글이나 열기 → 저장 동작 확인
5. 로그아웃 → 헤더가 로그인 버튼으로 복귀
6. 로그아웃 상태에서 글 상세 → 댓글 작성 → 비밀번호로 삭제

하나라도 실패하면 되돌리고(`git checkout src/proxy.ts`) 원인을 조사한다. 이 태스크의 유일한 실질 리스크가 여기다.

확인 후 서버를 종료한다.

- [x] **Step 5: 커밋**

```bash
git add src/proxy.ts
git commit -m "⚡️ Clerk 미들웨어를 /admin·/api로 한정해 공개 요청 오버헤드 제거

공개 라우트는 auth()를 호출하지 않고 공개 Server Action도 bcrypt 방식이라
Clerk가 불필요하다. 전역 적용 시 CDN HIT 상태에서도 요청당 약 85ms가 붙었다
(정적 파일 20ms vs RSC 105ms, 동일 엣지·동일 HIT 5회 측정)."
```

---

### Task 2: CSP에 Google Analytics 도메인 허용

**Files:**

- Modify: `next.config.ts`
- Test: `next.config.test.ts` (신규)

**Interfaces:**

- Consumes: 없음
- Produces: `next.config.test.ts`에 `getCspHeaderValue()` 헬퍼를 정의한다. Task 3이 같은 파일에 테스트를 추가하지만 이 헬퍼를 쓰지는 않는다.

- [x] **Step 1: 실패하는 테스트 작성**

`next.config.test.ts`를 새로 만든다.

```ts
import { describe, expect, it } from 'vitest';
import nextConfig from './next.config';

/** next.config의 headers()에서 최상위 CSP 문자열을 꺼낸다. */
async function getCspHeaderValue(): Promise<string> {
  const headers = await nextConfig.headers!();
  const rule = headers.find((h) => h.source === '/(.*)');
  if (!rule) throw new Error('전역 헤더 규칙(/(.*))을 찾을 수 없습니다');
  const csp = rule.headers.find((h) => h.key === 'Content-Security-Policy');
  if (!csp) throw new Error('Content-Security-Policy 헤더를 찾을 수 없습니다');
  return csp.value;
}

/** CSP 문자열에서 특정 지시어의 소스 목록을 파싱한다. */
function getDirective(csp: string, name: string): string[] {
  const directive = csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `));
  if (!directive) throw new Error(`${name} 지시어를 찾을 수 없습니다`);
  return directive.split(/\s+/).slice(1);
}

describe('next.config CSP', () => {
  it('script-src가 Google Tag Manager를 허용한다', async () => {
    const csp = await getCspHeaderValue();
    expect(getDirective(csp, 'script-src')).toContain(
      'https://www.googletagmanager.com'
    );
  });

  it('connect-src가 Google Analytics 수집 엔드포인트를 허용한다', async () => {
    const csp = await getCspHeaderValue();
    const connectSrc = getDirective(csp, 'connect-src');
    expect(connectSrc).toContain('https://*.google-analytics.com');
    expect(connectSrc).toContain('https://*.analytics.google.com');
  });

  it('기존 Clerk 허용 항목이 유지된다', async () => {
    const csp = await getCspHeaderValue();
    const scriptSrc = getDirective(csp, 'script-src');
    expect(scriptSrc).toContain('https://clerk.yjlogs.com');
    expect(scriptSrc).toContain("'self'");
  });
});
```

- [x] **Step 2: 테스트 실패 확인**

```bash
npx vitest run next.config.test.ts
```

기대: 앞 두 테스트가 FAIL. 메시지는 `expected [ ... ] to contain 'https://www.googletagmanager.com'`. 세 번째(`기존 Clerk 허용 항목`)는 PASS.

- [x] **Step 3: CSP에 도메인 추가**

`next.config.ts`의 `script-src`와 `connect-src` 줄을 수정한다.

```ts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.yjlogs.com https://www.googletagmanager.com",
```

```ts
              "connect-src 'self' https://*.clerk.accounts.dev https://clerk.yjlogs.com https://clerk-telemetry.com https://*.google-analytics.com https://*.analytics.google.com",
```

`img-src`는 이미 `https:`를 허용하므로 변경하지 않는다.

- [x] **Step 4: 테스트 통과 확인**

```bash
npx vitest run next.config.test.ts
```

기대: 3개 모두 PASS.

- [x] **Step 5: 커밋**

```bash
git add next.config.ts next.config.test.ts
git commit -m "🐛 CSP가 Google Analytics를 차단하던 문제 수정

script-src에 googletagmanager.com이 없어 GA 스크립트 로드가 배포 이후
계속 차단되고 있었다. 재발 방지를 위해 CSP 지시어 테스트를 추가한다."
```

---

### Task 3: 이미지 캐시 정책 (next.config)

**Files:**

- Modify: `next.config.ts`
- Modify: `next.config.test.ts` (Task 2에서 만든 파일 맨 끝에 `describe` 블록 추가)

**Interfaces:**

- Consumes: Task 2가 만든 `next.config.test.ts` 파일. 기존 import와 헬퍼를 그대로 두고 새 `describe` 블록만 덧붙인다.
- Produces: 없음

- [x] **Step 1: 실패하는 테스트 작성**

`next.config.test.ts` **맨 끝에** 아래 블록을 추가한다. 파일 상단의 import는 이미 존재하므로 다시 쓰지 않는다.

```ts
describe('next.config images', () => {
  it('minimumCacheTTL이 1년으로 설정된다', () => {
    // R2 원본이 Cache-Control을 보내지 않아 Next 기본값(4시간)으로 폴백하던 문제.
    // 업로드 경로가 타임스탬프 기반이라 같은 URL에 다른 내용이 덮이지 않으므로
    // 1년이 안전하다.
    expect(nextConfig.images?.minimumCacheTTL).toBe(31536000);
  });

  it('deviceSizes를 4종으로 축소해 콜드 미스 표면을 줄인다', () => {
    // 콘텐츠 폭이 980px이라 2x DPI를 감안해도 1920px 초과 변형은 쓰이지 않는다.
    expect(nextConfig.images?.deviceSizes).toEqual([640, 828, 1080, 1920]);
  });

  it('imageSizes는 변경하지 않는다', () => {
    expect(nextConfig.images?.imageSizes).toBeUndefined();
  });

  it('기존 remotePatterns가 유지된다', () => {
    const hostnames = nextConfig.images?.remotePatterns?.map((p) => p.hostname);
    expect(hostnames).toContain('assets.yjlogs.com');
  });
});
```

- [x] **Step 2: 테스트 실패 확인**

```bash
npx vitest run next.config.test.ts
```

기대: `minimumCacheTTL`(`undefined`를 받음)과 `deviceSizes`(`undefined`를 받음) 두 개가 FAIL. `imageSizes`·`remotePatterns`는 PASS.

- [x] **Step 3: images 설정 추가**

`next.config.ts`의 `images` 블록을 아래로 교체한다.

```ts
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.yjlogs.com',
      },
    ],
    // R2 원본에 Cache-Control이 없어 기본값 4시간으로 폴백하던 것을 1년으로 올린다.
    // 업로드 키가 `images/post-{id}/...` 고정 경로이고 교체 시 새 글로 관리되므로
    // 같은 URL에 다른 내용이 덮이지 않는다.
    minimumCacheTTL: 31536000,
    // 콘텐츠 폭 980px 기준. 2x DPI를 감안해도 1920px 초과 변형은 사용되지 않는다.
    // 변형 수를 줄이면 저트래픽 환경에서 캐시 히트율이 올라간다.
    deviceSizes: [640, 828, 1080, 1920],
  },
```

- [x] **Step 4: 테스트 통과 확인**

```bash
npx vitest run next.config.test.ts
```

기대: 7개 모두 PASS (Task 2의 3개 + 이번 4개).

- [x] **Step 5: 빌드 확인**

```bash
npm run build
```

기대: 빌드 성공.

- [x] **Step 6: 커밋**

```bash
git add next.config.ts next.config.test.ts
git commit -m "⚡️ 이미지 최적화 캐시 수명 1년으로 상향 및 변형 수 축소

R2 원본에 Cache-Control이 없어 minimumCacheTTL 기본값 4시간으로 폴백,
저트래픽 환경에서 방문자 대부분이 콜드 미스(607ms)를 맞고 있었다.
deviceSizes도 콘텐츠 폭 980px에 맞춰 8종에서 4종으로 줄인다."
```

---

### Task 4: R2 업로드에 Cache-Control 부여

**Files:**

- Modify: `src/app/admin/posts/new/_services/upload-image.ts:93-99`
- Test: `src/app/admin/posts/new/_services/upload-image.test.ts` (신규)

**Interfaces:**

- Consumes: 없음
- Produces: 없음. `uploadImage`의 시그니처는 변하지 않는다 — `(formData: FormData, postId: number | null, type: 'thumbnail' | 'content') => Promise<UploadResult>`

Task 3이 기존 이미지를 구제한다면 이 태스크는 신규 업로드를 원천에서 고친다. 본문 이미지는 `next/image`를 거치지 않고 raw `<img>`로 R2에서 직접 로드되므로, 브라우저 캐시를 걸려면 원본 헤더가 반드시 필요하다.

- [x] **Step 1: 실패하는 테스트 작성**

`src/app/admin/posts/new/_services/upload-image.test.ts`를 새로 만든다.

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadImage } from './upload-image';

/** PutObjectCommand에 전달된 인자를 순서대로 수집한다. */
const putObjectArgs: Record<string, unknown>[] = [];
const sendMock = vi.fn().mockResolvedValue({});

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send: sendMock })),
  PutObjectCommand: vi.fn((args: Record<string, unknown>) => {
    putObjectArgs.push(args);
    return { input: args };
  }),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'user_test' })),
}));

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(async () => undefined),
    })),
  },
}));

function buildFormData(): FormData {
  const formData = new FormData();
  formData.append(
    'file',
    new File(['fake-bytes'], 'thumb.png', { type: 'image/png' })
  );
  return formData;
}

describe('uploadImage', () => {
  beforeEach(() => {
    putObjectArgs.length = 0;
    sendMock.mockClear();
    vi.stubEnv('R2_BUCKET_NAME', 'test-bucket');
    vi.stubEnv('R2_PUBLIC_URL', 'https://assets.example.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('업로드 시 1년짜리 immutable Cache-Control을 부여한다', async () => {
    await uploadImage(buildFormData(), 42, 'thumbnail');

    expect(putObjectArgs).toHaveLength(1);
    expect(putObjectArgs[0].CacheControl).toBe(
      'public, max-age=31536000, immutable'
    );
  });

  it('기존 Key·ContentType 동작을 유지한다', async () => {
    await uploadImage(buildFormData(), 42, 'thumbnail');

    expect(putObjectArgs[0].Key).toBe('images/post-42/thumbnail.png');
    expect(putObjectArgs[0].ContentType).toBe('image/png');
    expect(putObjectArgs[0].Bucket).toBe('test-bucket');
  });

  it('업로드된 공개 URL을 반환한다', async () => {
    const result = await uploadImage(buildFormData(), 42, 'thumbnail');

    expect(result).toEqual({
      url: 'https://assets.example.com/images/post-42/thumbnail.png',
      postId: 42,
    });
  });
});
```

- [x] **Step 2: 테스트 실패 확인**

```bash
npx vitest run src/app/admin/posts/new/_services/upload-image.test.ts
```

기대: 첫 번째 테스트가 FAIL — `expected undefined to be 'public, max-age=31536000, immutable'`. 나머지 두 개는 PASS(기존 동작이므로).

- [x] **Step 3: CacheControl 추가**

`upload-image.ts`의 `PutObjectCommand` 호출을 수정한다.

```ts
await r2.send(
  new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    // 업로드 키가 글 ID·인덱스로 고정되고 교체 시 새 키가 생기므로 immutable이 안전하다.
    // 이 헤더가 없으면 next/image는 minimumCacheTTL로 폴백하고,
    // 본문 raw <img>는 브라우저 캐시가 아예 걸리지 않는다.
    CacheControl: 'public, max-age=31536000, immutable',
  })
);
```

- [x] **Step 4: 테스트 통과 확인**

```bash
npx vitest run src/app/admin/posts/new/_services/upload-image.test.ts
```

기대: 3개 모두 PASS.

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_services/upload-image.ts src/app/admin/posts/new/_services/upload-image.test.ts
git commit -m "⚡️ R2 업로드에 immutable Cache-Control 부여

원본에 캐시 지시가 없어 next/image는 4시간 후 재최적화하고,
본문 raw <img>는 브라우저 캐시가 걸리지 않아 매 방문 재다운로드했다."
```

---

### Task 5: 네비게이션 프로그레스 바

**Files:**

- Create: `src/components/navigation-progress.tsx`
- Create: `src/components/navigation-progress.test.tsx`
- Modify: `src/app/layout.tsx:69` (`<PageTracker />` 다음 줄)

**Interfaces:**

- Consumes: 없음
- Produces:
  - `shouldStartProgress(event: MouseEvent, anchor: HTMLAnchorElement | null, currentPathname: string): boolean` — 클릭이 프로그레스 바를 띄울 내부 네비게이션인지 판정하는 순수 함수. 테스트 대상.
  - `NavigationProgress(): JSX.Element` — props 없는 전역 컴포넌트.

`loading.tsx`를 쓰지 않는 이유는 설계 문서 3.4 참조 — Suspense 경계가 응답을 스트리밍시켜 `notFound()`가 soft 404(본문 404, 상태 200)를 만든다. 프로그레스 바는 순수 클라이언트라 이 문제가 없다.

- [x] **Step 1: 패키지 설치**

```bash
npm install @tanem/react-nprogress
```

`@tanem/react-nprogress`는 마크업과 CSS를 전혀 렌더하지 않는 headless 프리미티브다. `useNProgress({ isAnimating })`가 `{ animationDuration, isFinished, progress }`를 돌려주고 바는 우리가 그린다. Next 라우터 내부에 훅을 걸지 않기 때문에 프레임워크 버전 변화에 영향받지 않는다.

배포판 소스를 직접 확인한 동작 특성(테스트가 여기에 의존한다):

- 초기 상태는 `phase: 'idle'`이고 `isFinished = (phase === 'finished' || phase === 'idle')`이므로 **마운트 직후 `isFinished`는 `true`** → 바가 숨겨진 상태로 시작한다.
- `isAnimating` 변화는 평범한 `useEffect` 안에서 **동기 dispatch**로 처리된다. `act()` 안에서 즉시 반영된다.
- 트리클과 완료 페이드아웃만 `requestAnimationFrame`을 쓴다. `setTimeout`은 쓰지 않는다.
- `animationDuration` 기본값은 `200`ms.

- [x] **Step 2: 실패하는 테스트 작성**

`src/components/navigation-progress.test.tsx`를 새로 만든다.

```tsx
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationProgress, shouldStartProgress } from './navigation-progress';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

/** 지정한 href를 가진 앵커를 document에 붙이고 반환한다. */
function appendAnchor(
  href: string,
  attrs: Record<string, string> = {}
): HTMLAnchorElement {
  const anchor = document.createElement('a');
  anchor.href = href;
  for (const [key, value] of Object.entries(attrs))
    anchor.setAttribute(key, value);
  document.body.appendChild(anchor);
  return anchor;
}

/** 좌클릭 MouseEvent를 만든다. */
function leftClick(init: MouseEventInit = {}): MouseEvent {
  return new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  });
}

describe('shouldStartProgress', () => {
  it('내부 링크 좌클릭은 추적한다', () => {
    const anchor = appendAnchor('/posts');
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(true);
  });

  it('앵커가 없으면 추적하지 않는다', () => {
    expect(shouldStartProgress(leftClick(), null, '/')).toBe(false);
  });

  it('수정키를 누른 클릭은 새 탭/창이므로 추적하지 않는다', () => {
    const anchor = appendAnchor('/posts');
    expect(shouldStartProgress(leftClick({ metaKey: true }), anchor, '/')).toBe(
      false
    );
    expect(shouldStartProgress(leftClick({ ctrlKey: true }), anchor, '/')).toBe(
      false
    );
    expect(
      shouldStartProgress(leftClick({ shiftKey: true }), anchor, '/')
    ).toBe(false);
    expect(shouldStartProgress(leftClick({ altKey: true }), anchor, '/')).toBe(
      false
    );
  });

  it('가운데 클릭은 추적하지 않는다', () => {
    const anchor = appendAnchor('/posts');
    expect(shouldStartProgress(leftClick({ button: 1 }), anchor, '/')).toBe(
      false
    );
  });

  it('외부 링크는 추적하지 않는다', () => {
    const anchor = appendAnchor('https://example.com/page');
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(false);
  });

  it('target="_blank"는 추적하지 않는다', () => {
    const anchor = appendAnchor('/posts', { target: '_blank' });
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(false);
  });

  it('download 속성이 있으면 추적하지 않는다', () => {
    const anchor = appendAnchor('/files/a.pdf', { download: '' });
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(false);
  });

  it('같은 문서 내 해시 링크는 추적하지 않는다', () => {
    const anchor = appendAnchor('/#section');
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(false);
  });

  it('현재 경로와 동일한 링크 재클릭은 추적하지 않는다', () => {
    const anchor = appendAnchor('/');
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(false);
  });

  it('이미 preventDefault된 이벤트는 추적하지 않는다', () => {
    const anchor = appendAnchor('/posts');
    const event = leftClick();
    event.preventDefault();
    expect(shouldStartProgress(event, anchor, '/')).toBe(false);
  });
});

describe('NavigationProgress', () => {
  beforeEach(() => {
    // setTimeout만 가짜로 만든다. useNProgress는 requestAnimationFrame으로
    // 트리클·페이드아웃을 돌리고 React도 자체 스케줄링을 쓰므로, 전부 가로채면
    // 렌더가 멈춰 테스트가 불안정해진다. 우리가 제어할 대상은 150ms 지연뿐이다.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기에는 숨겨져 있다', () => {
    render(<NavigationProgress />);
    expect(screen.getByTestId('navigation-progress')).toHaveStyle({
      opacity: '0',
    });
  });

  it('클릭 후 150ms 전에는 나타나지 않는다', () => {
    render(<NavigationProgress />);
    const anchor = appendAnchor('/posts');

    act(() => {
      anchor.dispatchEvent(leftClick());
      vi.advanceTimersByTime(149);
    });

    expect(screen.getByTestId('navigation-progress')).toHaveStyle({
      opacity: '0',
    });
  });

  it('클릭 후 150ms가 지나면 나타난다', () => {
    render(<NavigationProgress />);
    const anchor = appendAnchor('/posts');

    act(() => {
      anchor.dispatchEvent(leftClick());
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByTestId('navigation-progress')).toHaveStyle({
      opacity: '1',
    });
  });

  it('제외 대상 클릭은 150ms가 지나도 나타나지 않는다', () => {
    render(<NavigationProgress />);
    const anchor = appendAnchor('https://example.com/page');

    act(() => {
      anchor.dispatchEvent(leftClick());
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('navigation-progress')).toHaveStyle({
      opacity: '0',
    });
  });
});
```

- [x] **Step 3: 테스트 실패 확인**

```bash
npx vitest run src/components/navigation-progress.test.tsx
```

기대: 전부 FAIL — `Failed to resolve import "./navigation-progress"`.

- [x] **Step 4: 컴포넌트 구현** (원안 대비 2건 편차 — task-5-report.md 참고: 클릭 핸들러에 `flushSync` 추가, pathname 리셋을 `useEffect` 대신 렌더 중 상태 조정 패턴으로 변경. 각각 실패 테스트 1개, lint 에러 1개를 해결하기 위한 최소 수정)

`src/components/navigation-progress.tsx`를 새로 만든다.

> **2026-08-10 업데이트**: 아래 코드는 실제 구현과 2건 다르다(원안 대비 편차, task-5-report.md 참고) — ①클릭 핸들러의 `setIsPending(true)`가 `flushSync`로 감싸져 있다(React 19 자동 배칭 때문에 원안 그대로는 클릭 직후 짧은 전환에서 타이머 등록이 한 박자 밀리는 테스트 실패가 발생했다). ②pathname 리셋이 `useEffect` 대신 [React 공식 "렌더 중 상태 조정" 패턴](https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)이다(`useEffect`에서 `setState`를 직접 호출하면 `react-hooks/set-state-in-effect` lint 에러가 발생했다). `shouldStartProgress` 순수 함수는 무변경이다. 사람 검토 후 구현체를 최종안으로 채택했다.

```tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useNProgress } from '@tanem/react-nprogress';
import { flushSync } from 'react-dom';

/**
 * 전환이 이 시간보다 빨리 끝나면 바를 아예 띄우지 않는다.
 * 웜 전환은 100ms 안팎이라 지연이 없으면 깜빡이고 사라져 오히려 산만하다.
 */
const showDelayMs = 150;

/**
 * 네비게이션이 완료 신호 없이 끝난 경우(중단·오류) 바가 영원히 도는 것을 막는 안전장치.
 */
const maxDurationMs = 10000;

/**
 * 이 클릭이 프로그레스 바를 띄워야 할 내부 네비게이션인지 판정한다.
 *
 * App Router에는 "네비게이션 시작" 이벤트가 없어 앵커 클릭을 직접 가로채야 하고,
 * 브라우저 기본 동작으로 처리되는 클릭(새 탭·다운로드·외부 링크·해시)을
 * 걸러내지 않으면 바가 떴다가 사라지지 않는다.
 */
export function shouldStartProgress(
  event: MouseEvent,
  anchor: HTMLAnchorElement | null,
  currentPathname: string
): boolean {
  if (!anchor) return false;
  if (event.defaultPrevented) return false;

  // 좌클릭 외에는 브라우저가 새 탭·컨텍스트 메뉴 등으로 처리한다.
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return false;

  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  if (!anchor.getAttribute('href')) return false;

  // mailto:·tel:은 origin이 'null'이 되어 여기서 함께 걸러진다.
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;

  // 같은 문서 내 해시 이동은 라우트 전환이 아니다.
  if (url.hash && url.pathname === currentPathname) return false;

  // 같은 경로 재클릭은 전환이 일어나지 않아 완료 신호도 오지 않는다.
  if (url.pathname === currentPathname && url.search === window.location.search)
    return false;

  return true;
}

/**
 * 라우트 전환 중 화면 상단에 얇은 진행 바를 표시한다.
 *
 * `loading.tsx`를 쓰지 않는 이유: Suspense 경계가 응답을 스트리밍시켜
 * HTTP 상태가 200으로 확정된 뒤 notFound()가 실행되면 soft 404가 된다.
 * 이 컴포넌트는 순수 클라이언트라 서버 응답에 영향을 주지 않는다.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [trackedPathname, setTrackedPathname] = useState(pathname);

  // 경로가 바뀌면 전환이 끝난 것이다. 렌더 중 상태를 조정하는 React 공식 패턴
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)을
  // 쓴다 — useEffect에서 setState를 직접 호출하면 커밋 후 한 번 더 렌더가
  // 발생해 리액트 컴파일러 경고(react-hooks/set-state-in-effect) 대상이 된다.
  if (pathname !== trackedPathname) {
    setTrackedPathname(pathname);
    setIsPending(false);
    setIsVisible(false);
  }

  const { animationDuration, isFinished, progress } = useNProgress({
    isAnimating: isVisible,
  });

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a') ?? null;
      if (shouldStartProgress(event, anchor, window.location.pathname)) {
        // flushSync: 이 클릭 리스너는 document에 등록한 네이티브 이벤트라
        // React 18+ 자동 배칭 대상이다. 그냥 setIsPending(true)로 두면 다음
        // effect(setTimeout 등록)가 같은 브라우저 태스크 안에서 곧바로
        // 실행되지 않아, 클릭 직후 아주 짧은 지연 안에 전환이 끝나는 경우
        // 타이머 등록 자체가 한 박자 밀릴 수 있다. 클릭은 드물게 발생하는
        // 이벤트라 동기 플러시 비용은 무시할 만하다.
        flushSync(() => setIsPending(true));
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () =>
      document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  useEffect(() => {
    if (!isPending) return;

    const showTimer = setTimeout(() => setIsVisible(true), showDelayMs);
    const maxTimer = setTimeout(() => {
      setIsPending(false);
      setIsVisible(false);
    }, maxDurationMs);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(maxTimer);
    };
  }, [isPending]);

  return (
    <div
      data-testid="navigation-progress"
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-100 motion-reduce:transition-none!"
      style={{
        opacity: isFinished ? 0 : 1,
        transition: `opacity ${animationDuration}ms linear`,
      }}
    >
      <div
        className="h-0.5 bg-primary motion-reduce:transition-none!"
        style={{
          marginLeft: `${(-1 + progress) * 100}%`,
          transition: `margin-left ${animationDuration}ms linear`,
        }}
      />
    </div>
  );
}
```

`z-100`은 Tailwind v4 네이티브 유틸리티다(헤더가 `z-50`이므로 그 위에 온다). `motion-reduce:transition-none!`의 후행 `!`는 v4의 important 수식어로, 인라인 `transition`을 이긴다 — 둘 다 실제 컴파일로 확인했다.

- [x] **Step 5: 테스트 통과 확인**

```bash
npx vitest run src/components/navigation-progress.test.tsx
```

기대: 14개 모두 PASS.

- [x] **Step 6: 루트 레이아웃에 배치**

`src/app/layout.tsx`에서 import를 추가한다.

```tsx
import { NavigationProgress } from '@/components/navigation-progress';
```

`<PageTracker />` 바로 다음 줄에 배치한다.

```tsx
            <PageTracker />
            <NavigationProgress />
            {children}
```

- [x] **Step 7: 전체 테스트와 빌드 확인**

```bash
npm run test:run && npm run lint && npm run build
```

기대: 테스트 전량 PASS, lint 0 errors, 빌드 성공.

- [x] **Step 8: 로컬 프로덕션 서버로 육안 확인** (프로그램적으로 가능한 범위만 검증 — 엘리먼트 초기 숨김 상태, 콘솔 에러 없음, 실제 클릭 이벤트로 SPA 네비게이션 후 바 정상 숨김, modifier-key 클릭 제외 동작. Slow 3G 스로틀링으로 바가 나타났다 사라지는 시각적 확인, 뒤로/앞으로 가기, 외부 링크, 연속 클릭은 브라우저 도구 제약으로 미완료 — task-5-report.md 참고, 사람 검증 권장)

```bash
npx next start
```

`http://localhost:3000`에서 확인한다.

1. 헤더 네비게이션 클릭 → 전환이 빠르면 바가 **보이지 않는다**(정상)
2. DevTools에서 네트워크를 `Slow 3G`로 조절 후 클릭 → 상단에 바가 나타나고 전환 완료 시 **사라진다**
3. `cmd+클릭`으로 새 탭 열기 → 바가 나타나지 않는다
4. 브라우저 뒤로/앞으로 가기 → 바가 나타나지 않는다
5. 푸터의 외부 링크 클릭 → 바가 나타나지 않는다
6. 같은 메뉴를 두 번 연속 클릭 → 두 번째에 바가 뜬 채로 남지 않는다

가장 중요한 확인은 **바가 뜬 채로 남지 않는 것**이다. 확인 후 서버를 종료한다.

- [x] **Step 9: 커밋**

```bash
git add package.json package-lock.json src/components/navigation-progress.tsx src/components/navigation-progress.test.tsx src/app/layout.tsx
git commit -m "✨ 라우트 전환 상단 프로그레스 바 추가

loading.tsx는 Suspense 경계가 soft 404를 유발해 도입할 수 없다.
순수 클라이언트 컴포넌트로 같은 피드백을 제공한다.
Next 전용 래퍼는 모두 유지보수가 정체되어, 활발히 관리되는 headless
프리미티브(@tanem/react-nprogress)에 애니메이션만 맡기고 라우터 의존적인
네비게이션 감지는 직접 소유한다. 웜 전환에서 깜빡이지 않도록 150ms 지연 노출."
```

---

## 배포 후 검증

전체 머지·배포 후 프로덕션에서 설계 문서 4장의 성공 기준을 확인한다.

- [ ] **미들웨어 제거 확인**

```bash
curl -sI https://yjlogs.com/posts/dell-s2725qc -H "RSC: 1" | grep -i "x-clerk-auth-status"
```

기대: **아무것도 출력되지 않는다**(헤더 소멸). Task 1 Step 1에서는 `signed-out`이 나왔었다.

- [ ] **관리자 경로는 미들웨어 유지 확인**

```bash
curl -sI https://yjlogs.com/admin | grep -i "x-clerk-auth-status"
```

기대: `x-clerk-auth-status`가 **존재한다**.

- [ ] **응답 시간 개선 확인**

```bash
for i in 1 2 3 4 5; do curl -so /dev/null -w "%{time_total}\n" https://yjlogs.com/ -H "RSC: 1"; done
```

기대: **0.02~0.04초대**. 변경 전 0.10초 내외였다.

- [ ] **이미지 캐시 확인**

```bash
curl -sI "https://yjlogs.com/_next/image?url=https%3A%2F%2Fassets.yjlogs.com%2Fimages%2Fpost-1%2Fthumbnail.jpg&w=1080&q=75" | grep -i "cache-control"
```

기대: `max-age=31536000`. 변경 전 `max-age=14400`이었다.

- [ ] **신규 업로드 이미지의 원본 헤더 확인**

관리자에서 이미지를 하나 업로드한 뒤, 그 R2 URL로 확인한다.

```bash
curl -sI https://assets.yjlogs.com/images/post-<새글ID>/thumbnail.jpg | grep -i "cache-control"
```

기대: `public, max-age=31536000, immutable`.

- [ ] **GA 동작 확인**

배포 페이지를 열고 DevTools 콘솔에 `googletagmanager` CSP 차단 에러가 없는지 확인한다. GA4 실시간 리포트에 방문이 잡히는지 본다.

- [ ] **`srcset` 변형 축소 확인**

배포 페이지에서 썸네일 이미지의 `srcset` 속성을 확인한다.

기대: `640w`, `828w`, `1080w`, `1920w` 중에서만 나온다.

- [ ] **`x-nextjs-prerender` 유지 확인**

```bash
curl -sI https://yjlogs.com/posts/dell-s2725qc -H "RSC: 1" | grep -iE "x-nextjs-prerender|x-vercel-cache"
```

기대: `x-nextjs-prerender: 1`, `x-vercel-cache: HIT`. 미들웨어 축소가 정적 프리렌더를 깨지 않았음을 확인한다.

## 완료 후

- `develop`으로 PR을 올린다(squash 금지, `--no-ff` 머지).
- 설계 문서 2.5의 홈 ISR 재생성(554ms `PRERENDER`)을 재관측한다. 여전히 발생하면 별도 과제로 등록한다.
