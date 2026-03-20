# 코딩 컨벤션

## 함수 & 변수

- 함수·변수명은 camelCase
- 불리언 변수는 `is` / `has` 접두사 (예: `isPublished`, `hasError`)
- 상수(환경 변수 제외)는 camelCase로 작성한다

## 날짜 처리

- 날짜 포맷·연산은 **date-fns**를 사용한다 (`toLocaleDateString`, `toLocaleString` 등 네이티브 날짜 메서드 사용 금지)
- 한국어 로케일이 필요하면 `import { ko } from "date-fns/locale"` 후 옵션에 전달한다
- 예: `format(new Date(date), "yyyy년 M월 d일", { locale: ko })`

## Import

- React의 hook, 타입 등은 named import로 사용한다 (`import { useState, useEffect } from "react"`). `React.useState` 형태 사용 금지.

## 기타

- 타입 단언(`as`)은 가능하면 피하고, Zod 파싱 결과를 활용한다
- `console.log`는 커밋하지 않는다
- 적절한 semantic tag는 적극적으로 활용한다
