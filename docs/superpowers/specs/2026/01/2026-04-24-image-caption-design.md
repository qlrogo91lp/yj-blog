# 이미지 캡션 기능 설계

## 개요

WYSIWYG 에디터(TipTap)의 이미지 블록에 캡션 입력 기능을 추가한다. 캡션은 `<figcaption>` HTML 시맨틱 태그로 이미지 하단에 렌더링되며, 블로그 글 상세 페이지에서 작은 회색 문구로 표시된다.

---

## 에디터 UX (선택 시 인라인 편집)

| 상태 | 동작 |
|------|------|
| 이미지 미선택 | 캡션 영역 없음 — 공간 차지 없이 깔끔 |
| 이미지 선택됨 | 이미지 하단에 얇은 회색 밑줄 + `캡션 추가...` placeholder 표시 |
| 캡션 입력 중 | 밑줄이 파란색(focus 색상)으로 강조 |
| 캡션 입력 완료 | 회색 이탤릭 텍스트로 표시 (선택 해제 후에도 유지) |

---

## 아키텍처

### 1. `image-extension.ts` — `caption` 속성 추가

`ImageBlock` TipTap 확장에 `caption` attribute를 추가한다.

- **기본값**: `''` (빈 문자열)
- **parseHTML**: `<figcaption>` 자식 노드의 텍스트 내용을 읽어 복원
- **renderHTML**: NodeView가 직접 렌더링하므로 HTML 출력은 NodeView 담당

### 2. `image-node-view.tsx` — 캡션 입력 UI 렌더링

- `caption` 속성 읽기 및 `updateAttributes({ caption })` 로 업데이트
- `selected || caption` 조건일 때 캡션 영역 표시 (미선택 + 캡션 없으면 숨김)
- `<figcaption>` 내부에 `<input>` 배치
  - `onKeyDown` 에서 `stopPropagation` — TipTap 단축키 충돌 방지
  - `onBlur` 에서 `updateAttributes` 호출
  - placeholder: `"캡션 추가..."`
- 스타일: `border-bottom: 1px solid` (회색), focus 시 파란색, 배경 투명

### 3. `prose.css` — 블로그 글 상세 스타일

```css
.prose figcaption {
  font-size: 0.8125rem;   /* 13px */
  color: var(--muted-foreground);
  font-style: italic;
  text-align: center;
  margin-top: 0.375rem;
}
```

---

## HTML 출력 구조

TipTap이 저장하는 HTML에 `<figcaption>`이 포함되어 블로그 렌더링 시 별도 처리 없이 표시된다.

```html
<!-- 캡션 있는 이미지 -->
<figure data-size="medium" data-align="center">
  <img src="..." alt="..." data-size="medium" data-align="center" />
  <figcaption>강남역 저녁 풍경</figcaption>
</figure>

<!-- 캡션 없는 이미지 -->
<figure data-size="medium" data-align="center">
  <img src="..." alt="..." data-size="medium" data-align="center" />
</figure>
```

---

## 범위 외 (YAGNI)

- 마크다운 모드에서의 캡션 지원 (WYSIWYG 전용)
- 캡션 텍스트 서식 (볼드, 링크 등)
- 캡션 정렬 별도 옵션
