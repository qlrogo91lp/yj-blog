# Ralli 지원·랜딩 페이지 디자인

**작성일:** 2026-05-28
**범위:** yj-blog 내 Ralli(테니스 점수 앱)의 App Store 지원 URL 겸 랜딩 페이지 + 개인정보 처리방침 페이지
**언어:** 영문 단독 (en) — App Store 글로벌 노출 대상
**관련 문서:** `tennis_counter/docs/superpowers/specs/ios/2026-05-20-app-store-listing-design.md` (톤 가이드·카피 출처)

---

## 1. 목적

- **App Store 지원 URL**로 제출할 공개 페이지 확보 (문의 이메일 노출 필수).
- 동시에 **랜딩 페이지** 역할 — 앱 소개·기능·스크린샷으로 다운로드 유도.
- App Store 제출에 함께 필요한 **개인정보 처리방침 URL** 확보.
- 빠른 출시가 우선. 과한 인터랙션·애니메이션 없이 정적 페이지로 간결하게.

URL:
- 랜딩/지원: `https://<도메인>/apps/ralli`
- 개인정보 처리방침: `https://<도메인>/apps/ralli/privacy`

---

## 2. 라우팅 / 기술 접근

- **`src/app/(main)/apps/ralli/page.tsx`** (정적 세그먼트) — Next.js App Router에서 정적 라우트가 `[slug]` 동적 라우트보다 우선한다. 이 파일이 생기면 기존 공용 `[slug]` 템플릿 대신 Ralli 전용 커스텀 페이지가 렌더된다. 다른 앱(`timelens` 등)은 그대로 공용 템플릿 사용.
- **`apps-data.ts`의 `ralli` 항목은 유지** — `/apps` 목록 카드에서 그대로 쓰이고, 카드 클릭 시 `/apps/ralli`로 진입하면 커스텀 페이지가 받는다. (apps-data 추가 변경 없음)
- **`src/app/(main)/apps/ralli/privacy/page.tsx`** — 개인정보 처리방침.
- 두 페이지 모두 정적 페이지. 서버 컴포넌트로 작성, 클라이언트 상태 없음.
- 페이지 전용 데이터·상수는 `_utils`(또는 `_constants`)에 분리.

### 이미지 호스팅
- 고정 자산이므로 R2가 아닌 `public/ralli/`에 둔다 (git 버전 관리, 빠름).
- `next/image`로 표시.
- 현재 보유 자산(`public/ralli/`):
  - `icon1.png` (1024×1024) — 앱 아이콘 (라임그린 배경 테니스볼 'R' 레터마크, 정사각형 → CSS로 라운드 처리)
  - iOS (1284×2778, App Store용 완성 이미지·헤드라인 합성됨): `ios-match-global.png`, `ios-live-global.png`, `ios-mode-global.png`, `ios-workout-global.png`, `ios-summary-global.png`
  - 연결: `connectivity-global.png` (1284×2778, iPhone+Watch)
  - Watch (422×514, 디바이스 목업): `watch-home-global.png`, `watch-match-global.png`, `watch-mode-global.png`, `watch-complication-global.png`, `watch-workout-global.png`

### App Store 링크
- 아직 미출시. `appStoreUrl` 상수를 데이터에 두고, 값이 없으면 **"Coming soon"** 배지, 값이 채워지면 **App Store 다운로드 버튼**으로 전환.
- 출시 후 상수 한 줄만 채우면 됨.

### 테마
- 스크린샷이 모두 검은 배경 → 사이트 라이트/다크 테마와 무관하게 **페이지 자체를 다크 톤**으로 고정 (블랙/딥차콜 배경 + 라임그린 강조 + 오렌지 보조).
- next-themes 토글의 영향을 받지 않도록 섹션 컨테이너에 다크 배경·텍스트 색을 명시.

---

## 3. 톤 가이드 (리스팅 문서 준수)

1. **"분쟁/다툼/시비/싸움/갈등" 등 부정 어휘 금지.** 점수 카운팅 보조 도구로 포지셔닝.
2. **HealthKit(운동 기록)은 부수 기능이 아니라 점수 카운팅과 동등한 가치 축.**
3. **친근하고 가벼운 톤.** 전문 용어·고급 분석 강조 금지.
4. **플랫폼 위계:** Apple Watch = 메인 도구, iPhone = 경기 후 다시보기 보조 도구. "워치와 폰을 동시에 본다", "코트에서 친구와 공유" 류 표현 금지.

---

## 4. 랜딩/지원 페이지 `/apps/ralli` 구성

위에서 아래로 단일 컬럼, 모바일 우선. 카피는 리스팅 문서 영문안을 그대로/축약 사용.

### 4.1 Hero
- 앱 아이콘(라운드), 앱 이름 **Ralli**, 태그라인 **"Tennis scores, right on your wrist."**
- 한 줄 보조 설명: "A score-counting companion for tennis players."
- CTA: `appStoreUrl` 있으면 App Store 다운로드 버튼, 없으면 "Coming soon to the App Store" 배지.

### 4.2 기능 섹션 4개 (리스팅 4대 가치 축)
각 섹션은 헤드라인 + 불릿 2~3개 + 관련 스크린샷.

1. **On the court, all on your wrist** (Apple Watch 중심)
   - Score, pick a format, check results — entirely from Apple Watch
   - Launch from your watch face with a complication
   - At a glance on the Lock Screen and Dynamic Island
   - 이미지: `watch-match-global.png`, `watch-complication-global.png`
2. **A match is a workout — logged automatically** (HealthKit)
   - Seamlessly tied to a HealthKit workout session
   - Calories, heart rate, and workout time tracked automatically
   - Syncs with the Apple Fitness app
   - 이미지: `watch-workout-global.png`, `ios-workout-global.png`
3. **Replay every match on iPhone** (iOS 다시보기)
   - Set-by-set scores, kcal, and workout time in detail
   - Your tennis days stacked on a calendar, automatically
   - Monthly and lifetime stats
   - 이미지: `ios-summary-global.png`, `ios-live-global.png`
4. **Play by your own rules** (경기 포맷)
   - Customizable set length: 4, 5, or 6 games
   - No-ad, no-tie, and tiebreak support
   - 이미지: `watch-mode-global.png`, `ios-mode-global.png`

### 4.3 스크린샷 갤러리
- iOS(완성 이미지) + Watch 스크린샷을 가로 스크롤 또는 반응형 그리드로 배치.
- iOS는 세로 비율(1284×2778), Watch는 약 정사각(422×514). 비율별로 그룹화하여 표시.

### 4.4 지원(Support) 섹션
- 제목: "Support" / "Need help?"
- 문의 이메일 **qlrogo91lp@gmail.com** — `mailto:` 링크, 화면에도 텍스트로 노출.
- 개인정보 처리방침 링크 → `/apps/ralli/privacy`.

### 4.5 푸터
- 간단한 카피라이트, `/apps` 목록으로 돌아가는 링크.

---

## 5. 개인정보 처리방침 `/apps/ralli/privacy` 구성

영문, 단순 텍스트. **데이터 저장 모델: SwiftData(기기 로컬) + CloudKit(사용자 본인의 비공개 iCloud 동기화).** 개발자 운영 서버로의 전송은 없다.

섹션:
1. **Intro** — 시행일(Effective date), 앱 이름.
2. **Data we access** — HealthKit 운동 세션·심박수·칼로리 등은 운동 기록 목적에만 사용. 경기 점수·기록은 SwiftData로 기기에 저장.
3. **iCloud sync (CloudKit)** — 경기 데이터는 CloudKit을 통해 사용자 **본인의 비공개 iCloud 계정**에만 동기화되어 사용자의 여러 기기에서 공유됨. 데이터는 Apple이 관리하며, 개발자는 접근하지 않음.
4. **Data we do NOT collect / share** — 개발자 운영 서버로 전송하지 않음, 제3자 공유·판매 없음, 광고 추적 없음, 분석 SDK 없음, 계정 로그인 없음(Apple ID 기반 iCloud만 사용).
5. **HealthKit** — Apple HealthKit 데이터는 광고 목적 사용 금지 등 Apple 정책 준수 명시.
6. **Children / 기타** — 필요 시 간단히.
7. **Contact** — qlrogo91lp@gmail.com.

> 데이터 모델은 사용자 확인 완료(2026-05-28): SwiftData + CloudKit, 외부 서버 전송 없음.

---

## 6. 컴포넌트 분해

프로젝트 폴더 규칙(`page-folder.md`, `component.md`) 준수. 파일명 kebab-case, 컴포넌트명 PascalCase, 외부 의존성 없는 순수 컴포넌트는 `_components`.

```
src/app/(main)/apps/ralli/
  page.tsx                         # 랜딩/지원 페이지 조합 (서버 컴포넌트)
  _components/
    ralli-hero.tsx                 # Hero (아이콘·이름·태그라인·CTA)
    ralli-feature-section.tsx      # 기능 섹션 1개 (props로 헤드라인·불릿·이미지)
    ralli-screenshot-gallery.tsx   # 스크린샷 갤러리
    ralli-support.tsx              # 지원(이메일·개인정보 링크)
    ralli-cta-button.tsx           # App Store 버튼 / Coming soon 배지 분기
  _utils/
    ralli-content.ts               # 카피·기능 데이터·스크린샷 목록·appStoreUrl·이메일 상수
  privacy/
    page.tsx                       # 개인정보 처리방침 (서버 컴포넌트, 정적 텍스트)
```

- `ralli-content.ts`에 모든 카피/이미지 경로/상수를 모아 페이지·섹션은 데이터만 매핑하여 렌더 → 카피 수정이 한 곳에서.
- 각 컴포넌트는 props로만 동작하는 순수 컴포넌트(상태·API 없음).

---

## 7. 메타데이터 / SEO

- `generateMetadata`(또는 정적 `metadata`)로 title `Ralli — Tennis Score | YJlogs`, description은 리스팅 부제 활용.
- OG 이미지로 `icon1.png` 또는 대표 스크린샷 지정(선택).
- privacy 페이지는 간단한 title/description.

---

## 8. 비범위 (YAGNI)

- 다국어(한/영 동시) — 영문 단독.
- 다크/라이트 테마 토글 대응 — 페이지는 다크 고정.
- 애니메이션·스크롤 인터랙션·캐러셀 라이브러리 — 기본 CSS 스크롤/그리드로 충분.
- apps-data 스키마 확장 — Ralli만 커스텀이므로 공용 스키마 손대지 않음.
- App Store 배지 공식 에셋 — 우선 텍스트/단순 버튼, 출시 시 공식 배지로 교체 가능.

---

## 9. 검증

- `npm run build` 통과(정적 생성 확인), `npm run lint` 통과.
- 개발 서버에서 `/apps/ralli`, `/apps/ralli/privacy` 실제 렌더 확인 (이미지 로드, 다크 배경에 스크린샷 자연스럽게 표시, 모바일/데스크톱 반응형, mailto·privacy 링크 동작).
- `/apps` 목록 카드 → `/apps/ralli` 진입이 커스텀 페이지로 연결되는지 확인.

---

## 10. 변경 이력

- 2026-05-28: 초안 작성. 라우팅·페이지 구성·컴포넌트 분해·개인정보 처리방침 범위 확정.
