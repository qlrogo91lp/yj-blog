# TimeLens — 작업 시간 트래커

개인 작업 시간(공부, 사이드 프로젝트, 기타 일 외 활동)을 기록하고 통계로 시각화하는 웹앱.
블로그 내 `/apps/timelens` 경로에서 동작한다.

---

## 핵심 기능

- **타이머**: 작업 시작/정지로 실제 작업 시간 기록. 하루 중 여러 번 시작/정지 가능 (누적 측정)
- **기상 시간 기록**: 하루의 시작 시점을 기록하여 가용 시간 대비 작업 비율 파악
- **작업 분류**: 카테고리별 작업 구분 (공부, 프로젝트, 독서 등)
- **통계 대시보드**: 일별/주간/월별 작업 시간 그래프
- **인증**: 타이머 조작은 관리자(Clerk 인증)만 가능

---

## Phase 1 — DB 스키마 & 기본 타이머

### 1-1. DB 테이블 추가 (`src/db/schema.ts`)

```
timelens_categories
├── id (serial PK)
├── name (varchar) — "공부", "사이드 프로젝트", "독서" 등
├── color (varchar) — 그래프 표시용 HEX 색상
├── order (integer) — 정렬 순서
└── createdAt (timestamp)

timelens_sessions
├── id (serial PK)
├── categoryId (FK → timelens_categories)
├── title (varchar, nullable) — 세션 메모 (선택)
├── startedAt (timestamp) — 시작 시간
├── endedAt (timestamp, nullable) — 종료 시간 (null이면 진행 중)
├── duration (integer) — 초 단위 총 작업 시간
└── createdAt (timestamp)

timelens_daily_log
├── id (serial PK)
├── date (date, unique) — 해당 날짜
├── wakeUpAt (timestamp, nullable) — 기상 시간
├── totalDuration (integer) — 해당일 총 작업 시간 (초). 세션 종료 시 갱신
└── createdAt (timestamp)
```

> 블로그 기존 `categories`와 충돌 방지를 위해 `timelens_` 접두사 사용
> `timelens_daily_log`는 하루 단위 요약 테이블. 기상 시간 기록 + 일별 누적 시간 캐싱 역할

### 1-2. 쿼리 함수 (`src/db/queries/timelens.ts`)

- `getTimelensCategories()` — 카테고리 목록
- `getActiveSession()` — 현재 진행 중인 세션 (endedAt IS NULL)
- `getSessionsByDateRange(start, end)` — 기간별 세션 조회
- `getTodaySessions()` — 오늘 세션 목록
- `getTodayLog()` — 오늘의 daily_log (기상 시간, 누적 작업 시간)

### 1-3. Server Actions (`src/app/(main)/apps/timelens/_services/`)

- `start-session.ts` — 타이머 시작 (새 세션 생성)
- `stop-session.ts` — 타이머 정지 (endedAt, duration 업데이트 + daily_log.totalDuration 갱신)
- `delete-session.ts` — 세션 삭제
- `record-wake-up.ts` — 기상 시간 기록 (daily_log upsert)
- `create-category.ts` — 카테고리 추가
- `update-category.ts` — 카테고리 수정
- `delete-category.ts` — 카테고리 삭제

### 1-4. 타이머 UI (`src/app/(main)/apps/timelens/page.tsx`)

```
┌─────────────────────────────────────┐
│  TimeLens                           │
├─────────────────────────────────────┤
│                                     │
│  기상: 07:30  │  가용: 14h 30m      │  ← 기상 시간 & 기상 후 경과
│  [ 기상 기록 ]                       │  ← 미기록 시 버튼 노출
│                                     │
├─────────────────────────────────────┤
│                                     │
│           02:34:17                   │  ← 현재 세션 경과 시간
│       오늘 누적: 4h 12m             │  ← 오늘 총 작업 시간
│                                     │
│     [ 카테고리 선택 ▾ ]              │  ← 드롭다운
│     [ 메모 입력 (선택) ]             │  ← 텍스트 입력
│                                     │
│         [ ▶ 시작 ]                   │  ← 시작/정지 토글
│                                     │
├─────────────────────────────────────┤
│  오늘의 기록                         │
│  ─────────────────────────────────  │
│  09:00-10:23  React 공부    1h 23m  │
│  11:00-11:45  블로그 개발   0h 45m  │
│  13:30-15:34  React 공부    2h 04m  │  ← 같은 카테고리 여러 세션
│  ─────────────────────────────────  │
│  합계 (3회)                4h 12m   │
└─────────────────────────────────────┘
```

- 타이머는 클라이언트에서 `setInterval`로 표시, 실제 시간은 서버 timestamp 기준
- 하루 중 여러 번 시작/정지 가능 — 각각 별도 세션으로 기록, 누적 합산 표시
- 기상 시간 기록: 하루 첫 접속 시 "기상 기록" 버튼 노출. 기록 후 가용 시간(기상~현재) 대비 작업 비율 파악 가능
- 시작/정지 버튼은 Clerk 인증된 사용자만 노출
- 비인증 사용자는 타이머 영역 대신 앱 소개 표시
- 오늘의 기록은 시간순으로 모든 세션 표시 (카테고리 색상 포함)

### 1-5. 상태 관리

- `useTimerStore` (Zustand) — 클라이언트 타이머 상태
  - `isRunning`, `elapsedSeconds`, `activeSessionId`
  - `startTimer()`, `stopTimer()`, `tick()`
- 페이지 진입 시 `getActiveSession()`으로 진행 중 세션 복원

---

## Phase 2 — 통계 대시보드

### 2-1. 통계 페이지 (`src/app/(main)/apps/timelens/stats/page.tsx`)

```
┌─────────────────────────────────────┐
│  TimeLens 통계        [일|주|월]     │  ← 기간 탭
├─────────────────────────────────────┤
│                                     │
│  오늘: 3h 24m    이번 주: 18h 05m   │  ← 요약 카드
│  이번 달: 72h 30m  일 평균: 2h 25m  │
│  평균 기상: 07:15  가용 대비: 32%   │  ← 기상 시간 평균 & 작업 비율
│                                     │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │    주간 작업 시간 (막대 그래프)  │  │
│  │  6h ┤  ██                     │  │
│  │  4h ┤  ██ ██    ██            │  │
│  │  2h ┤  ██ ██ ██ ██ ██        │  │
│  │     └──월─화─수─목─금─토─일──  │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │   카테고리별 비율 (도넛 차트)   │  │
│  │   ██ React 공부      45%     │  │
│  │   ██ 블로그 개발      30%     │  │
│  │   ██ 독서            25%     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2-2. 쿼리 함수 추가

- `getWeeklyStats(date)` — 해당 주 일별 합산 시간
- `getMonthlyStats(date)` — 해당 월 일별 합산 시간
- `getCategoryStats(start, end)` — 기간별 카테고리 비율
- `getDailyAverage(start, end)` — 일 평균 작업 시간
- `getWakeUpStats(start, end)` — 기간별 평균 기상 시간 & 가용 시간 대비 작업 비율

### 2-3. 차트 라이브러리

기존 통계 페이지에서 사용 중인 **Recharts** 활용:
- `BarChart` — 일별/주별 작업 시간
- `PieChart` — 카테고리별 비율

---

## Phase 3 — 카테고리 관리 & 세션 편집

### 3-1. 카테고리 관리 UI

- 타이머 페이지 내 설정 아이콘(⚙️)으로 접근
- 다이얼로그에서 카테고리 추가/수정/삭제
- 색상 선택기 포함

### 3-2. 세션 수동 편집

- 오늘의 기록에서 세션 클릭 → 시간 수정 가능
- 수동 세션 추가 (타이머 안 쓰고 직접 시간 입력)
- 세션 삭제

---

## Phase 4 — SEO & 검색 유입

### 4-1. 메타데이터 (`generateMetadata`)

각 페이지에 Next.js `generateMetadata`로 정적 메타 적용:

| 페이지 | title | description |
|--------|-------|-------------|
| `/apps/timelens` | "TimeLens — 공부 시간 타이머 & 작업 시간 트래커" | "하루 작업 시간을 기록하고 일별·주간·월별 통계로 시각화하는 무료 웹 타이머" |
| `/apps/timelens/stats` | "TimeLens 통계 — 작업 시간 분석 대시보드" | "일별 평균, 주간·월별 작업 시간 추이를 그래프로 확인하세요" |

```typescript
// 예시
export const metadata: Metadata = {
  title: "TimeLens — 공부 시간 타이머 & 작업 시간 트래커",
  description: "하루 작업 시간을 기록하고 일별·주간·월별 통계로 시각화하는 무료 웹 타이머",
  openGraph: {
    title: "TimeLens — 공부 시간 타이머",
    description: "작업 시간 기록 & 통계 시각화",
    url: "https://yjlogs.com/apps/timelens",
    type: "website",
  },
}
```

### 4-2. 구조화 데이터 (JSON-LD)

`WebApplication` 스키마로 검색엔진에 앱 정보 전달:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "TimeLens",
  "description": "작업 시간을 기록하고 통계로 시각화하는 웹 타이머",
  "url": "https://yjlogs.com/apps/timelens",
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0" }
}
```

### 4-3. 랜딩 영역 (비인증 사용자용)

검색 유입 시 비인증 사용자가 처음 보는 영역. SEO 크롤러도 이 콘텐츠를 읽음:

```
┌─────────────────────────────────────┐
│  TimeLens                           │
│  작업 시간을 기록하고 분석하세요      │
├─────────────────────────────────────┤
│                                     │
│  - 원클릭 타이머로 작업 시간 기록    │
│  - 하루 중 여러 번 누적 측정         │
│  - 카테고리별 분류 & 통계 그래프     │
│  - 기상 시간 기록으로 가용 시간 파악 │
│                                     │
│  [ 스크린샷 or 미리보기 이미지 ]     │
│                                     │
└─────────────────────────────────────┘
```

- 타이머 기능 소개를 시맨틱 태그(`h1`, `h2`, `ul`)로 마크업 → 크롤러 가독성 확보
- 추후 공개 프로필 기능과 결합 가능 (추후 계획 섹션 참조)

---

## Phase 5 — UX 개선

### 5-1. 기능 보완

- 브라우저 탭 타이틀에 경과 시간 표시 (`document.title`)
- 타이머 진행 중 페이지 이탈 시 확인 다이얼로그 (`beforeunload`)
- 키보드 단축키 (Space로 시작/정지)
- 최근 사용 카테고리 우선 표시

### 5-2. 반응형

- 모바일에서도 타이머 조작 가능하도록 터치 최적화
- 통계 차트 모바일 대응

---

## 추후 계획 (공개 프로필)

> 현재는 관리자 전용이지만, 추후 방문자에게 활동을 공개하는 방향 검토

- **공개 프로필 페이지**: 비인증 사용자가 `/apps/timelens` 방문 시 앱 소개 + 최근 활동 요약 표시
  - "이 앱은 ~~~ 입니다" 소개 텍스트
  - 최근 7일 작업 시간 요약 (읽기 전용)
  - 오늘의 작업 상태 (현재 작업 중인지 여부)
- **활동 뱃지**: 블로그 메인이나 프로필에 "오늘 Xh Ym 작업" 뱃지 노출
- **공개 범위 설정**: 설정에서 통계 공개/비공개 토글
