# Apps 목록 아이템 컴포넌트 — 설계 문서

- 작성일: 2026-08-12
- 대상: `/apps` 목록 페이지, `/apps/[slug]` 상세 페이지
- 참고: `src/components/post/post-archive-row.tsx` (가로 배치 리스트 아이템의 기존 선례)

## 배경 / 목표

현재 `/apps` 목록의 `AppCard`는 **세로 배치**이고 앱 아이콘이 없다. 앱을 소개하는 화면인데 정작 앱의 얼굴인 아이콘이 빠져 있어, 카드만 봐서는 어떤 앱인지 감이 오지 않는다.

블로그 글 목록(`PostArchiveRow`)은 이미 `[썸네일 | 텍스트]` 가로 배치를 쓰고 있다. 같은 톤으로 **앱 아이콘을 앞세운 가로 배치 카드**로 바꾸고, 동시에 **이 앱이 iOS인지 watchOS인지 둘 다인지**를 아이콘 라벨로 드러낸다.

동작(라우팅·데이터 소스)은 바꾸지 않는다. 표시 구조와 데이터 모델만 손댄다.

## 확정된 결정 사항

브레인스토밍에서 시안을 비교해 아래로 확정했다.

| 항목        | 결정                                   | 비고                                                      |
| ----------- | -------------------------------------- | --------------------------------------------------------- |
| 아이템 형태 | **카드** (테두리 + radius + hover)     | 리스트 행(구분선만) 안 / 기존 `AppCard`의 톤 유지         |
| 배치        | **`[아이콘 \| 내용 \| chevron]` 가로** | 아이콘은 카드 **내부** 좌측                               |
| 태그 칩     | **표시하지 않음**                      | 상세 페이지에만 유지. 2열에서 카드가 세로로 길어짐        |
| 플랫폼 라벨 | **아이콘 + 텍스트 칩**                 | 아이콘만(의미 불분명) 안 / 한 줄 텍스트(3개 이상 잘림) 안 |
| 목록 그리드 | **`sm:grid-cols-2` 유지**              | 1열 전환 검토했으나 현행 유지로 결정                      |
| 카드 radius | **`rounded-2xl` (18px)**               | 아래 radius 절 참고                                       |
| 적용 범위   | 목록 + **상세 페이지 헤더까지**        | 두 화면의 플랫폼 표기를 일치시킨다                        |

### radius 값 근거

`globals.css`의 토큰만 쓴다 (`--radius: 0.625rem` = 10px 기준).

| 토큰           | 계산             | 값   | 이 설계에서의 용도               |
| -------------- | ---------------- | ---- | -------------------------------- |
| `rounded-lg`   | `var(--radius)`  | 10px | — (기존 `AppCard` 값, 교체됨)    |
| `rounded-xl`   | `--radius + 4px` | 14px | **목록 아이콘 56px**             |
| `rounded-2xl`  | `--radius + 8px` | 18px | **카드**, 상세 아이콘 72px       |
| `rounded-card` | `2rem`           | 32px | — (post 타일 전용, 여기선 안 씀) |

- **아이콘 `rounded-xl`(14px)** — `post-archive-row.tsx:19`의 썸네일과 **같은 토큰**이다(그쪽은 64px, 여기는 56px). iOS 앱 아이콘의 실제 곡률 비율(≈22%)로 계산하면 56px에서 12.5px라, 토큰 중 14px이 가장 가깝다.
- **카드 `rounded-2xl`(18px)** — post 타일은 `rounded-card`(32px)를 쓰지만 그 값은 세로 400px+ 타일 기준이다. 앱 카드는 높이 ~88px라 32px를 주면 양 끝이 거의 반원이 된다. 기존 10px보다 부드럽고 32px보다 과하지 않은 18px을 쓴다.
- **바깥(18px) > 안쪽(14px)** — 중첩된 모서리는 바깥 radius가 더 커야 두 곡선이 어긋나 보이지 않는다.

## 설계

### 1. 데이터 모델 (`_utils/apps-data.ts`)

현재 `type: 'web' | 'app-store'`는 **배포 채널**만 구분할 뿐 iOS/watchOS를 표현하지 못한다. 이 필드를 플랫폼 배열로 교체한다.

```ts
export type AppPlatform = 'ios' | 'watch' | 'web';

export type App = {
  slug: string;
  name: string;
  description: string;
  iconSrc: string; // 추가
  platforms: AppPlatform[]; // type 대체
  tags: string[];
  longDescription: string;
  links: { label: string; url: string }[];
};
```

Ralli 데이터:

```ts
{
  slug: 'ralli',
  name: 'Ralli',
  description: '테니스 경기 중 점수 카운터 앱',
  iconSrc: '/ralli/icon1.png',
  platforms: ['ios', 'watch'],
  // tags·longDescription·links는 그대로
}
```

`iconSrc`로 쓸 `/ralli/icon1.png`는 이미 `public/`에 존재한다 (1024×1024 PNG).

> **`type`을 남겨두지 않는 이유**: `platforms`에 `'web'`이 있으면 웹앱 여부가 이미 표현된다. 두 필드를 같이 두면 "웹앱인데 platforms에 web이 없는" 모순 상태가 만들어질 수 있다.

### 2. `_components/app-platform-chips.tsx` (신규)

플랫폼 → 아이콘·레이블 매핑을 한 곳에 가둔다. 목록과 상세가 같은 표기를 쓰게 하려는 목적이며, 이 파일이 없으면 매핑이 두 파일에 복제되어 시간이 지나면 어긋난다.

```tsx
import { Globe, LucideIcon, Smartphone, Watch } from 'lucide-react';
import type { AppPlatform } from '../_utils/apps-data';

const platformMeta: Record<AppPlatform, { label: string; Icon: LucideIcon }> = {
  ios: { label: 'iPhone', Icon: Smartphone },
  watch: { label: 'Watch', Icon: Watch },
  web: { label: 'Web', Icon: Globe },
};

type Props = {
  platforms: AppPlatform[];
};

export function AppPlatformChips({ platforms }: Props) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {platforms.map((platform) => {
        const { label, Icon } = platformMeta[platform];
        return (
          <li
            key={platform}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            <Icon size={12} />
            {label}
          </li>
        );
      })}
    </ul>
  );
}
```

- 순수 컴포넌트(props만 받아 렌더)이므로 `_components`에 둔다.
- lucide 아이콘 크기는 `className`이 아닌 `size` 속성으로 지정한다 (`coding-conventions.md`).
- `LucideIcon` 타입은 `image-toolbar.tsx:30`이 이미 쓰는 방식과 같다.

### 3. `_components/app-list-item.tsx` (신규, `app-card.tsx` 대체)

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { App } from '../_utils/apps-data';
import { AppPlatformChips } from './app-platform-chips';

type Props = {
  app: App;
};

export function AppListItem({ app }: Props) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-muted/50"
    >
      <Image
        src={app.iconSrc}
        alt={`${app.name} 앱 아이콘`}
        width={56}
        height={56}
        sizes="56px"
        className="size-14 flex-none rounded-xl"
      />

      <div className="min-w-0 flex-1">
        <AppPlatformChips platforms={app.platforms} />
        <h2 className="mt-1.5 font-semibold">{app.name}</h2>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {app.description}
        </p>
      </div>

      <ChevronRight
        size={18}
        className="flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
```

설계 포인트:

- **`min-w-0 flex-1`** — flex 자식의 기본 `min-width: auto` 때문에 `truncate`가 동작하지 않는다. 2열 그리드에서 긴 설명이 카드를 밀어내는 걸 막는 필수 처리다.
- **`size-14`(56px)** — Tailwind v4 spacing 스케일(`56 ÷ 4 = 14`). `w-14 h-14` 대신 `size-14`.
- **radius는 카드 `rounded-2xl`(18px) / 아이콘 `rounded-xl`(14px)** — 근거는 위 radius 절 참고.
- **카드 전체를 `<Link>`로 감싼다** — 기존 `AppCard`와 동일. `PostArchiveRow`의 stretched-link(`after:absolute`) 방식은 카드 안에 별도 링크가 있을 때 필요한데, 여기는 그럴 일이 없어 더 단순한 쪽을 쓴다.
- **chevron은 hover 시 살짝 이동** — 기존 `AppCard`의 `opacity-0 → group-hover:opacity-100` 대신. 항상 보이는 편이 클릭 가능함을 더 잘 알린다.

`app-card.tsx`는 삭제한다.

### 4. 목록 페이지 (`apps/page.tsx`)

`AppCard` → `AppListItem` 교체만. 그리드는 그대로 둔다.

```tsx
<div className="mt-8 grid gap-4 sm:grid-cols-2">
  {apps.map((app) => (
    <AppListItem key={app.slug} app={app} />
  ))}
</div>
```

### 5. 상세 페이지 (`apps/[slug]/page.tsx`)

`app.type`을 제거했으므로 **수정하지 않으면 컴파일되지 않는다.** 현재의 `Globe`/`Smartphone` + `웹앱`/`앱스토어` 텍스트 블록을 `AppPlatformChips`로 교체하고, 앱 아이콘을 헤더에 함께 노출한다.

```tsx
<div className="mt-6 flex items-start gap-4">
  <Image
    src={app.iconSrc}
    alt={`${app.name} 앱 아이콘`}
    width={72}
    height={72}
    sizes="72px"
    className="size-18 flex-none rounded-2xl"
  />
  <div className="min-w-0">
    <AppPlatformChips platforms={app.platforms} />
    <h1 className="mt-2 text-3xl font-bold">{app.name}</h1>
    <p className="mt-2 text-muted-foreground">{app.description}</p>
  </div>
</div>
```

태그 칩은 상세 페이지에서 **그대로 유지**한다(목록에서만 뺀다). 사용하지 않게 된 `Globe`·`Smartphone` import는 제거한다.

### 6. 테스트 (`_components/app-list-item.test.tsx`)

`testing.md`의 Vitest 패턴을 따른다. `next/image`·`next/link`는 jsdom에서 동작하지 않으므로 `vi.mock`으로 교체한다.

검증 항목:

| 테스트                          | 확인 대상                                               |
| ------------------------------- | ------------------------------------------------------- |
| 앱 이름과 설명을 렌더한다       | `getByRole('heading', { name: 'Ralli' })`, 설명 텍스트  |
| 상세 페이지로 링크한다          | `getByRole('link')`의 `href === '/apps/ralli'`          |
| 앱 아이콘을 alt와 함께 렌더한다 | `getByRole('img')`의 `alt === 'Ralli 앱 아이콘'`, `src` |
| 플랫폼 칩을 모두 렌더한다       | `platforms: ['ios','watch']` → `iPhone`·`Watch` 표시    |
| 웹앱은 Web 칩을 렌더한다        | `platforms: ['web']` → `Web` 표시, `iPhone` 미표시      |

마지막 항목은 현재 데이터에 웹앱이 없으므로 **테스트 전용 fixture**로 검증한다 — 세 번째 분기가 죽은 코드가 아님을 보장한다.

## 영향 범위

| 파일                                 | 변경                                    |
| ------------------------------------ | --------------------------------------- |
| `_utils/apps-data.ts`                | `type` 제거, `platforms`·`iconSrc` 추가 |
| `_components/app-list-item.tsx`      | 신규                                    |
| `_components/app-platform-chips.tsx` | 신규                                    |
| `_components/app-card.tsx`           | 삭제                                    |
| `_components/app-list-item.test.tsx` | 신규                                    |
| `apps/page.tsx`                      | import·컴포넌트 교체                    |
| `apps/[slug]/page.tsx`               | 플랫폼 표기 교체, 아이콘 추가           |

`next.config.ts`의 이미지 설정은 건드리지 않는다 — `/ralli/icon1.png`는 `public/` 로컬 자산이라 remote patterns 등록이 필요 없다.

## 안 하는 것 (YAGNI)

- **앱 추가·데이터 확장** — Ralli 1개 그대로. 두 번째 앱이 생길 때 다시 본다.
- **목록 정렬·필터·검색** — 앱이 1개다.
- **플랫폼 칩 클릭 시 필터링** — 위와 같은 이유.
- **아이콘 없는 앱의 폴백 UI** — `iconSrc`를 필수 필드로 두어 애초에 빈 상태를 만들지 않는다.
- **E2E 추가** — 기존 `e2e/ralli.spec.ts`가 `/apps` → Ralli 카드 진입을 이미 커버한다(`getByRole('link', { name: /Ralli/ })`). 이 변경 후에도 통과해야 하며, 통과 여부는 구현 시 확인한다.

## 검증 기준

- `npx tsc --noEmit` 에러 0건 — 특히 `type` 제거로 인한 잔여 참조가 없어야 한다.
- `npm run test:run` 전체 통과 (신규 테스트 5건 포함).
- `npm run test:e2e`의 `/apps` 진입 시나리오 통과.
- `npm run build` 성공.
- 실제 화면 확인: 2열 그리드에서 카드가 밀리지 않는지, 다크 모드에서 칩·아이콘 대비가 유지되는지.
