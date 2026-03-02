import 'dotenv/config'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { categories, posts } from '../src/db/schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const categoryData = [
  {
    name: 'JavaScript',
    slug: 'javascript',
    description: '자바스크립트 기초부터 심화까지',
  },
  {
    name: 'TypeScript',
    slug: 'typescript',
    description: '타입스크립트로 더 안전한 코드 작성하기',
  },
  {
    name: 'React',
    slug: 'react',
    description: 'React와 생태계 학습',
  },
]

const now = new Date()
const dayAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)

const postData = [
  {
    slug: 'javascript-closure',
    title: '자바스크립트 클로저 완전 정복',
    excerpt: '클로저가 무엇인지, 어떻게 동작하는지, 그리고 실제로 어떻게 활용하는지 알아봅니다.',
    content: `# 자바스크립트 클로저 완전 정복

클로저(Closure)는 자바스크립트에서 가장 중요하고 강력한 개념 중 하나입니다.

## 클로저란?

클로저는 **함수와 그 함수가 선언된 렉시컬 환경의 조합**입니다.

\`\`\`javascript
function outer() {
  const message = 'Hello, Closure!'

  function inner() {
    console.log(message) // 외부 함수의 변수에 접근
  }

  return inner
}

const greet = outer()
greet() // "Hello, Closure!"
\`\`\`

## 왜 클로저가 만들어지는가?

자바스크립트 엔진은 함수를 생성할 때, 그 함수가 선언된 스코프의 참조를 함수 객체에 저장합니다.

| 개념 | 설명 |
|------|------|
| 렉시컬 스코프 | 함수가 **정의된** 위치 기준으로 스코프 결정 |
| 실행 컨텍스트 | 함수가 **호출될** 때 생성되는 환경 |
| 클로저 | 외부 함수가 종료된 후에도 내부 함수가 외부 변수에 접근 가능 |

## 실전 활용 예시

### 1. 데이터 캡슐화

\`\`\`javascript
function createCounter() {
  let count = 0

  return {
    increment() { count++ },
    decrement() { count-- },
    value() { return count },
  }
}

const counter = createCounter()
counter.increment()
counter.increment()
console.log(counter.value()) // 2
\`\`\`

### 2. 함수 팩토리

\`\`\`javascript
function multiply(factor) {
  return (number) => number * factor
}

const double = multiply(2)
const triple = multiply(3)

console.log(double(5)) // 10
console.log(triple(5)) // 15
\`\`\`

## 주의사항

반복문에서 클로저를 잘못 사용하면 의도치 않은 동작이 발생할 수 있습니다.

\`\`\`javascript
// 잘못된 예 (var 사용)
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000) // 3, 3, 3
}

// 올바른 예 (let 사용)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000) // 0, 1, 2
}
\`\`\`

## 정리

클로저는 자바스크립트의 핵심 메커니즘으로, 데이터 은닉, 팩토리 패턴, 메모이제이션 등 다양한 패턴의 기반이 됩니다.
`,
    categorySlug: 'javascript',
    status: 'published' as const,
    publishedAt: dayAgo(7),
  },
  {
    slug: 'typescript-generics',
    title: 'TypeScript 제네릭 마스터하기',
    excerpt: '제네릭을 사용하면 타입을 재사용 가능하게 만들 수 있습니다. 기초부터 고급 패턴까지 알아봅니다.',
    content: `# TypeScript 제네릭 마스터하기

제네릭(Generic)은 타입스크립트에서 **타입을 파라미터처럼 다루는** 기능입니다.

## 기본 문법

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg
}

const num = identity<number>(42)   // T = number
const str = identity('hello')      // T = string (추론)
\`\`\`

## 제네릭 제약 (Constraints)

\`\`\`typescript
interface HasLength {
  length: number
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length)
  return arg
}

logLength('hello')    // OK
logLength([1, 2, 3])  // OK
logLength(42)         // Error: number에는 length가 없음
\`\`\`

## 유틸리티 타입

타입스크립트는 제네릭 기반의 유용한 유틸리티 타입을 제공합니다.

| 유틸리티 | 설명 | 예시 |
|---------|------|------|
| \`Partial<T>\` | 모든 속성을 선택적으로 | \`Partial<User>\` |
| \`Required<T>\` | 모든 속성을 필수로 | \`Required<Config>\` |
| \`Pick<T, K>\` | 특정 속성만 선택 | \`Pick<User, 'id' \\| 'name'>\` |
| \`Omit<T, K>\` | 특정 속성 제외 | \`Omit<User, 'password'>\` |
| \`Record<K, V>\` | 키-값 맵 타입 | \`Record<string, number>\` |

## 조건부 타입 (Conditional Types)

\`\`\`typescript
type IsArray<T> = T extends unknown[] ? true : false

type A = IsArray<string[]>  // true
type B = IsArray<number>    // false
\`\`\`

## infer 키워드

\`\`\`typescript
type ReturnType<T> = T extends (...args: unknown[]) => infer R ? R : never

function getData(): { id: number; name: string } {
  return { id: 1, name: 'Alice' }
}

type Data = ReturnType<typeof getData>
// { id: number; name: string }
\`\`\`

## 실전 패턴: API 응답 래퍼

\`\`\`typescript
interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

async function fetchUser(id: number): Promise<ApiResponse<User>> {
  const res = await fetch(\`/api/users/\${id}\`)
  return res.json()
}
\`\`\`

제네릭을 잘 활용하면 코드 재사용성을 높이면서도 완전한 타입 안전성을 유지할 수 있습니다.
`,
    categorySlug: 'typescript',
    status: 'published' as const,
    publishedAt: dayAgo(5),
  },
  {
    slug: 'react-hooks-deep-dive',
    title: 'React Hooks 깊이 파헤치기',
    excerpt: 'useState, useEffect부터 useReducer, useCallback, useMemo까지 React Hooks의 동작 원리를 이해합니다.',
    content: `# React Hooks 깊이 파헤치기

Hooks는 함수 컴포넌트에서 상태와 사이드 이펙트를 관리하는 방법입니다.

## useState - 상태 관리

\`\`\`tsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(prev => prev + 1)}>
        증가
      </button>
    </div>
  )
}
\`\`\`

> **팁**: 이전 상태를 기반으로 업데이트할 때는 함수형 업데이터를 사용하세요.

## useEffect - 사이드 이펙트

\`\`\`tsx
import { useState, useEffect } from 'react'

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setUser(data)
      })

    // 클린업 함수
    return () => { cancelled = true }
  }, [userId]) // userId가 바뀔 때마다 재실행

  if (!user) return <div>Loading...</div>
  return <div>{user.name}</div>
}
\`\`\`

## useReducer - 복잡한 상태

\`\`\`tsx
type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment': return state + 1
    case 'decrement': return state - 1
    case 'reset': return 0
  }
}

function Counter() {
  const [count, dispatch] = useReducer(reducer, 0)

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  )
}
\`\`\`

## 성능 최적화 Hooks

| Hook | 용도 | 언제 사용? |
|------|------|-----------|
| \`useMemo\` | 값 메모이제이션 | 비용이 큰 계산 |
| \`useCallback\` | 함수 메모이제이션 | 자식에 콜백 전달 시 |
| \`useRef\` | 렌더링 없이 값 보존 | DOM 참조, 타이머 ID |

\`\`\`tsx
const expensiveValue = useMemo(() => {
  return items.filter(item => item.active).length
}, [items])

const handleClick = useCallback(() => {
  onSelect(item.id)
}, [item.id, onSelect])
\`\`\`

Hooks의 규칙을 지키고, 의존성 배열을 올바르게 관리하는 것이 핵심입니다.
`,
    categorySlug: 'react',
    status: 'published' as const,
    publishedAt: dayAgo(3),
  },
  {
    slug: 'typescript-type-narrowing',
    title: 'TypeScript 타입 내로잉 완벽 가이드',
    excerpt: '타입 가드, in 연산자, instanceof, 판별 유니온 등 TypeScript의 타입 내로잉 기법을 알아봅니다.',
    content: `# TypeScript 타입 내로잉 완벽 가이드

타입 내로잉(Type Narrowing)은 유니온 타입을 더 구체적인 타입으로 좁히는 과정입니다.

## typeof 가드

\`\`\`typescript
function format(value: string | number): string {
  if (typeof value === 'string') {
    return value.toUpperCase() // string
  }
  return value.toFixed(2) // number
}
\`\`\`

## instanceof 가드

\`\`\`typescript
function processError(error: Error | string) {
  if (error instanceof Error) {
    console.error(error.message) // Error 타입
  } else {
    console.error(error) // string 타입
  }
}
\`\`\`

## in 연산자

\`\`\`typescript
interface Dog { bark(): void }
interface Cat { meow(): void }

function makeSound(animal: Dog | Cat) {
  if ('bark' in animal) {
    animal.bark() // Dog
  } else {
    animal.meow() // Cat
  }
}
\`\`\`

## 판별 유니온 (Discriminated Union)

\`\`\`typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }
  | { kind: 'rectangle'; width: number; height: number }

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2
    case 'square':
      return shape.side ** 2
    case 'rectangle':
      return shape.width * shape.height
  }
}
\`\`\`

판별 유니온은 switch 문과 함께 사용할 때 **완전성 검사(exhaustiveness check)**가 가능합니다.

## 사용자 정의 타입 가드

\`\`\`typescript
interface User {
  id: number
  name: string
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  )
}

const data = JSON.parse(response)
if (isUser(data)) {
  console.log(data.name) // User 타입으로 안전하게 사용
}
\`\`\`

타입 내로잉을 잘 활용하면 런타임 오류를 컴파일 타임에 잡을 수 있습니다.
`,
    categorySlug: 'typescript',
    status: 'published' as const,
    publishedAt: dayAgo(1),
  },
  {
    slug: 'javascript-async-await',
    title: 'JavaScript 비동기 프로그래밍: Promise와 async/await',
    excerpt: '콜백 지옥에서 벗어나 Promise와 async/await로 깔끔한 비동기 코드를 작성하는 방법을 알아봅니다.',
    content: `# JavaScript 비동기 프로그래밍: Promise와 async/await

자바스크립트는 단일 스레드 언어이지만, 비동기 처리로 네트워크 요청, 파일 읽기 등을 효율적으로 처리합니다.

## 콜백의 문제점

\`\`\`javascript
// 콜백 지옥
getUser(id, (user) => {
  getPosts(user.id, (posts) => {
    getComments(posts[0].id, (comments) => {
      // 깊어질수록 유지보수가 어려워짐
    })
  })
})
\`\`\`

## Promise

\`\`\`javascript
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    fetch(\`/api/users/\${id}\`)
      .then(res => {
        if (!res.ok) reject(new Error('Not found'))
        return res.json()
      })
      .then(resolve)
      .catch(reject)
  })
}

// 체이닝
fetchUser(1)
  .then(user => fetchPosts(user.id))
  .then(posts => fetchComments(posts[0].id))
  .then(comments => console.log(comments))
  .catch(err => console.error(err))
\`\`\`

## async/await

\`\`\`javascript
async function loadData(userId) {
  try {
    const user = await fetchUser(userId)
    const posts = await fetchPosts(user.id)
    const comments = await fetchComments(posts[0].id)
    return comments
  } catch (error) {
    console.error('데이터 로딩 실패:', error)
    throw error
  }
}
\`\`\`

## 병렬 처리

\`\`\`javascript
// 순차 실행 (느림)
const user = await fetchUser(1)
const settings = await fetchSettings(1)

// 병렬 실행 (빠름)
const [user, settings] = await Promise.all([
  fetchUser(1),
  fetchSettings(1),
])
\`\`\`

## Promise 유틸리티

| 메서드 | 설명 |
|--------|------|
| \`Promise.all\` | 모두 완료될 때까지 대기, 하나라도 실패하면 reject |
| \`Promise.allSettled\` | 모두 완료될 때까지 대기, 성공/실패 모두 반환 |
| \`Promise.race\` | 가장 먼저 완료된 결과 반환 |
| \`Promise.any\` | 가장 먼저 성공한 결과 반환 |

## 에러 처리 패턴

\`\`\`javascript
// 결과를 [error, data] 튜플로 반환하는 패턴
async function tryFetch(url) {
  try {
    const data = await fetch(url).then(r => r.json())
    return [null, data]
  } catch (error) {
    return [error, null]
  }
}

const [error, user] = await tryFetch('/api/user')
if (error) {
  console.error(error)
} else {
  console.log(user)
}
\`\`\`

async/await는 Promise를 기반으로 하므로, Promise를 먼저 이해하는 것이 중요합니다.
`,
    categorySlug: 'javascript',
    status: 'published' as const,
    publishedAt: dayAgo(0),
  },
]

async function main() {
  console.log('🌱 시드 데이터 삽입 시작...')

  // 카테고리 삽입
  console.log('📁 카테고리 삽입 중...')
  const insertedCategories = await db
    .insert(categories)
    .values(categoryData)
    .onConflictDoNothing()
    .returning()

  console.log(`✅ 카테고리 ${insertedCategories.length}개 삽입됨`)

  // 전체 카테고리 조회 (기존 데이터 포함)
  const allCategories = await db.select().from(categories)
  const categoryMap = new Map(allCategories.map(c => [c.slug, c.id]))

  // 게시글 삽입
  console.log('📝 게시글 삽입 중...')
  let postCount = 0

  for (const post of postData) {
    const { categorySlug, ...postFields } = post
    const categoryId = categoryMap.get(categorySlug)

    if (!categoryId) {
      console.warn(`⚠️  카테고리를 찾을 수 없음: ${categorySlug}`)
      continue
    }

    await db
      .insert(posts)
      .values({
        ...postFields,
        categoryId,
      })
      .onConflictDoNothing()

    postCount++
  }

  console.log(`✅ 게시글 ${postCount}개 삽입됨`)
  console.log('🎉 시드 완료!')
}

main().catch(err => {
  console.error('❌ 시드 실패:', err)
  process.exit(1)
})
