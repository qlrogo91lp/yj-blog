# 수정 계획: 설정 페이지 (blog_settings)

> 작성일: 2026-04-07
> 우선순위: Low
> 관련 파일: `src/app/admin/settings/page.tsx` (현재 placeholder)

## 배경

`src/app/(main)/_constants/profile.ts`에 블로그 이름, tagline, authorBio, socialLinks 등이 하드코딩돼 있다. DB 기반 설정으로 이관해 관리자 UI에서 편집 가능하게 만든다.

---

## 수정 계획

### 1. `blog_settings` 테이블 설계

**`src/db/schema.ts`에 추가**

```ts
export const blogSettings = pgTable("blog_settings", {
  id:                     integer("id").primaryKey().default(1),  // 단일 row
  blogName:               varchar("blog_name", { length: 100 }).notNull(),
  tagline:                varchar("tagline", { length: 255 }),
  authorBio:              text("author_bio"),
  siteUrl:                varchar("site_url", { length: 255 }),
  socialLinks:            jsonb("social_links").$type<Record<string, string>>(),
  defaultMetaDescription: varchar("default_meta_description", { length: 300 }),
  updatedAt:              timestamp("updated_at").defaultNow().notNull(),
})
```

- 단일 row (`id = 1`) 전략 사용
- `npx drizzle-kit push`로 DB 반영

### 2. 쿼리 추가

**`src/db/queries/settings.ts` (신규)**

```ts
export const getBlogSettings = unstable_cache(
  async () => db.query.blogSettings.findFirst(),
  [CACHE_TAGS.settings],
  { tags: [CACHE_TAGS.settings] }
)
```

**`src/db/cache-tags.ts`**

```ts
export const CACHE_TAGS = {
  // ... 기존
  settings: "settings",
}
```

### 3. Server Action

**`src/app/admin/settings/_services/update-settings.ts`**

```ts
'use server'

export async function updateSettings(data: BlogSettingsFormValues) {
  await db
    .insert(blogSettings)
    .values({ id: 1, ...data })
    .onConflictDoUpdate({ target: blogSettings.id, set: data })

  revalidateTag(CACHE_TAGS.settings)
}
```

### 4. 설정 폼 컴포넌트

**`src/app/admin/settings/_components/settings-form.tsx`** (클라이언트)

- react-hook-form + zod 유효성 검증
- 필드: blogName, tagline, authorBio, siteUrl, defaultMetaDescription, socialLinks (GitHub, Twitter, LinkedIn 등)
- 저장 시 `toast.success('설정이 저장되었습니다')`

**`src/app/admin/settings/page.tsx`** (서버 컴포넌트)

```tsx
export default async function SettingsPage() {
  const settings = await getBlogSettings()
  return <SettingsForm defaultValues={settings} />
}
```

### 5. `profile.ts` 하드코딩 → DB 이관

- `src/app/(main)/_constants/profile.ts`의 값들을 `getBlogSettings()` 호출로 대체
- Hero Section, RSS 피드, 메타데이터 등 `profile.ts`를 참조하는 곳 수정

---

## 체크리스트

- [ ] `src/db/schema.ts` — `blog_settings` 테이블 추가
- [ ] `npx drizzle-kit push` — DB 반영 (초기 row INSERT 포함)
- [ ] `src/db/cache-tags.ts` — `settings` 태그 추가
- [ ] `src/db/queries/settings.ts` — `getBlogSettings` (unstable_cache)
- [ ] `src/app/admin/settings/_services/update-settings.ts` — Server Action
- [ ] `src/app/admin/settings/_components/settings-form.tsx` — react-hook-form + zod
- [ ] `src/app/admin/settings/page.tsx` — placeholder 대체
- [ ] `src/app/(main)/_constants/profile.ts` 참조 부분 → DB 값으로 이관
- [ ] Hero Section, RSS route.ts, layout.tsx metadata 수정
