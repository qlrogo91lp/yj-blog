# daily_stats 스키마 수정 및 admin 방문 제외 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `daily_stats` 테이블에서 불필요한 `id` 컬럼을 제거하고 `date`를 PK로 변경하며, admin 방문이 통계에 집계되지 않도록 수정한다.

**Architecture:** `daily_stats`는 날짜(date)당 1개 행만 존재하는 구조이므로 `date` 자체가 natural PK다. `id` 컬럼은 코드 어디에서도 참조되지 않으며, PostgreSQL의 upsert 시 sequence 증가 동작으로 인해 id 값이 비순차적으로 증가하는 문제를 유발하고 있다. `/api/track` 엔드포인트에서 Clerk `auth()`로 로그인 여부를 확인하여 admin 세션이면 early return한다.

**Tech Stack:** Drizzle ORM, PostgreSQL (Neon), `@clerk/nextjs/server`, `drizzle-kit`

---

### Task 1: `daily_stats` 스키마에서 `id` 제거, `date`를 PK로 변경

**Files:**
- Modify: `src/db/schema.ts:92-98`

- [ ] **Step 1: `dailyStats` 테이블 정의 수정**

`src/db/schema.ts` 의 `dailyStats` 테이블을 아래와 같이 변경한다.

```typescript
// Before
export const dailyStats = pgTable('daily_stats', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  date: date('date').notNull().unique(), // 'YYYY-MM-DD' 형태
  views: integer('views').notNull().default(0), // 일별 총 조회수
  visitors: integer('visitors').notNull().default(0), // 일별 순 방문자
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// After
export const dailyStats = pgTable('daily_stats', {
  date: date('date').primaryKey(), // 'YYYY-MM-DD' 형태 — natural PK
  views: integer('views').notNull().default(0), // 일별 총 조회수
  visitors: integer('visitors').notNull().default(0), // 일별 순 방문자
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

불필요해진 `integer` import도 확인한다. `integer`가 다른 테이블에서도 사용 중이므로 삭제하지 않는다.

- [ ] **Step 2: TypeScript 빌드 오류 확인**

```bash
npm run build 2>&1 | head -30
```

오류가 없으면 다음 단계로 진행한다. 오류가 있으면 해당 파일에서 `dailyStats.id` 참조를 찾아 제거한다.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "refactor: daily_stats에서 id 제거, date를 PK로 변경"
```

---

### Task 2: DB에 스키마 변경 적용

**Files:**
- DB: `daily_stats` 테이블 구조 변경 (컬럼 삭제 포함)

- [ ] **Step 1: 기존 데이터 전체 삭제**

기존 `daily_stats` 데이터는 모두 삭제하고 새로 쌓는다. Drizzle Studio(`npx drizzle-kit studio`)에서 직접 실행하거나, 아래 SQL을 Neon 콘솔에서 실행한다.

```sql
TRUNCATE TABLE daily_stats;
```

- [ ] **Step 2: drizzle-kit push 실행**

> ⚠️ `id` 컬럼이 삭제되므로 데이터 손실 경고가 표시된다. 기존 데이터는 이미 삭제했으므로 진행한다.

```bash
npx drizzle-kit push
```

drizzle-kit이 아래 변경 사항을 감지해야 한다:
- `id` 컬럼 DROP
- `date`의 `UNIQUE` 제약 제거 (PRIMARY KEY로 대체)
- `date` 컬럼을 PRIMARY KEY로 변경

컬럼 삭제 확인 프롬프트가 나오면 `yes`로 진행한다.

- [ ] **Step 3: Drizzle Studio로 결과 확인**

```bash
npx drizzle-kit studio
```

브라우저에서 `daily_stats` 테이블을 열어 다음을 확인한다:
- `id` 컬럼이 사라졌는가
- `date` 컬럼이 PRIMARY KEY로 표시되는가
- 테이블이 비어 있는가 (TRUNCATE 확인)

---

### Task 3: `/api/track`에서 admin 방문 제외

**Files:**
- Modify: `src/app/api/track/route.ts`

- [ ] **Step 1: `auth()` import 추가 및 admin 체크 삽입**

`src/app/api/track/route.ts` 상단에 import를 추가하고, POST 핸들러 맨 위에 admin 체크를 삽입한다.

```typescript
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dailyStats, posts, referrers } from '@/db/schema';

export async function POST(request: NextRequest) {
  // admin 방문은 통계에서 제외
  const { userId } = await auth();
  if (userId) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.json().catch(() => ({}));
  // ... 이하 기존 코드 유지
```

- [ ] **Step 2: TypeScript 빌드 오류 확인**

```bash
npm run build 2>&1 | head -30
```

오류 없음을 확인한다.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/track/route.ts
git commit -m "feat: /api/track에서 admin 방문 통계 제외"
```

---

### Task 4: 수동 통합 검증

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

- [ ] **Step 2: 비로그인 상태에서 방문 기록 확인**

브라우저 시크릿 창에서 `http://localhost:3000`의 글 하나를 방문한다.

```bash
# DB에서 오늘 날짜 row 확인
npx drizzle-kit studio
```

`daily_stats` 테이블에서 오늘 날짜의 `views`가 1 이상으로 증가했는지 확인한다.

- [ ] **Step 3: admin 로그인 상태에서 방문 후 미집계 확인**

admin으로 로그인한 상태에서 블로그 글 페이지를 방문한다. `daily_stats`의 `views`와 `visitors`가 증가하지 않는지 확인한다.

- [ ] **Step 4: id 이상 현상 해소 확인**

Drizzle Studio에서 `daily_stats` 테이블을 열어 `id` 컬럼이 없고 `date`가 PK임을 최종 확인한다.
