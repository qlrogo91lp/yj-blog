# post-content.tsx 이미지 줌·드래그 기능 코드 리뷰

**날짜**: 2026-06-30  
**파일**: `src/app/(main)/posts/[slug]/_components/post-content.tsx`  
**범위**: 이미지 확대 Dialog에 드래그 패닝 + 모바일 모달 스킵 기능 추가

---

## 발견된 버그 (8개, 전부 수정 완료)

### 🔴 치명 (즉시 기능 불가)

#### 1. 드래그 델타 항상 0 — 이미지가 전혀 움직이지 않음 (line 41)
**원인**: `setPosition` 함수형 업데이터 내에서 `drag.current.lastX`를 읽었으나, React는 업데이터를 핸들러 반환 후(렌더 단계)에 실행한다. 그 사이에 `drag.current.lastX = e.clientX` 변이가 먼저 실행되어, 업데이터 평가 시점에는 `e.clientX - drag.current.lastX = 0`.

**수정**: `dx`/`dy`를 `setPosition` 호출 전에 지역 변수로 캡처.

```ts
// before (broken)
setPosition((p) => ({ x: p.x + e.clientX - drag.current.lastX, ... }));
drag.current.lastX = e.clientX;

// after
const dx = e.clientX - drag.current.lastX;
drag.current.lastX = e.clientX;
setPosition((p) => ({ x: p.x + dx, ... }));
```

---

### 🟠 높음

#### 2. `window.matchMedia` jsdom 미구현 — 테스트 TypeError 크래시 (line 24 / test)
**원인**: `handleClick`에서 `window.matchMedia('(pointer: coarse)')` 호출. jsdom은 `matchMedia`를 구현하지 않아 이미지 클릭 테스트가 전부 크래시.

**수정**: `src/test.setup.ts`에 전역 `matchMedia` mock 추가.

#### 3. Dialog 닫힐 때 `isDragging` 미초기화 — 다음 오픈 시 유령 드래그 (line 63)
**원인**: `onOpenChange`가 `setZoomed(null)`만 호출. Escape로 드래그 중 닫으면 `isDragging=true`가 유지되어, 다음 이미지 오픈 시 mousedown 없이도 `handleMouseMove`가 position을 갱신.

**수정**: `resetDialog()` 헬퍼로 `scale`, `position`, `isDragging`, `drag.current.active`를 `onOpenChange`와 `handleClick`에서 모두 초기화.

#### 4. 고속 드래그 시 컨테이너 밖으로 나가면 드래그 강제 종료 (line 78)
**원인**: `onMouseMove`/`onMouseLeave`가 컨테이너 div에 붙어 있어, 빠른 마우스 이동으로 경계를 벗어나면 `onMouseLeave → stopDrag`. 다시 진입해도 재개 불가.

**수정**: mouse 이벤트 대신 **pointer 이벤트**로 전환 + `e.currentTarget.setPointerCapture(e.pointerId)`. pointer capture로 컨테이너 밖에서도 이벤트 수신 보장.

#### 5. position 바운드 없음 — 이미지를 완전히 팬 아웃 가능 (line 40)
**원인**: 드래그 이동량에 제한이 없어 `overflow-hidden` 영역 밖으로 이미지를 완전히 내보낼 수 있음. 4x→2x로 줄여도 off-screen 오프셋이 유지되어 이미지가 보이지 않게 됨.

**수정**: `containerRef`로 컨테이너 크기를 읽어 `clampPosition()` 추가. 최대 이동 범위 = `containerSize × (scale - 1) / 2`.

---

### 🟡 중간

#### 6. 줌 버튼 클릭 시 시점이 튀는 현상 (line 50)
**원인**: `changeScale`이 scale만 바꾸고 position을 그대로 유지. CSS scale은 이미지 layout 중심(50% 50%)을 기준으로 확대하므로, 팬된 상태에서 scale을 바꾸면 보이는 영역이 예상과 다른 위치로 이동.

**수정**: scale 변경 시 현재 시점 중심을 유지하도록 position 재앵커.

```ts
const reanchored = { x: position.x * next / scale, y: position.y * next / scale };
```

---

### 🔵 낮음 (컨벤션)

#### 7. UPPER_SNAKE_CASE 상수 — camelCase 규칙 위반 (lines 7-9)
`MIN_SCALE`, `MAX_SCALE`, `SCALE_STEP` → `minScale`, `maxScale`, `scaleStep`  
규칙: `coding-conventions.md` — "상수(환경 변수 제외)는 camelCase로 작성한다"

#### 8. `React.MouseEvent` 네임스페이스 형태 — named import 규칙 위반 (lines 21, 31, 38)
`React.MouseEvent<HTMLDivElement>` → `MouseEvent<HTMLDivElement>` (named import)  
규칙: `coding-conventions.md` — "React의 hook, 타입 등은 named import로 사용한다"

---

## 수정 파일 목록

| 파일 | 내용 |
|------|------|
| `src/app/(main)/posts/[slug]/_components/post-content.tsx` | 버그 1-8 전부 수정 |
| `src/test.setup.ts` | `window.matchMedia` 전역 mock 추가 |
| `src/app/(main)/posts/[slug]/_components/post-header.test.tsx` | "Back to index" → "목록으로" 텍스트 매칭 수정 |

## 테스트 결과

- `post-content.test.tsx` ✅ 2/2 통과
- `post-header.test.tsx` ✅ 4/4 통과
- `image-toolbar.test.tsx` ❌ 3/6 — **기존 버그**, 이번 변경과 무관
