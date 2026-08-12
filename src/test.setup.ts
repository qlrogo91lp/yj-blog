import '@testing-library/jest-dom';

// jsdom은 matchMedia를 구현하지 않으므로 전역 mock 추가
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom은 IntersectionObserver를 구현하지 않으므로 전역 mock 추가
class MockIntersectionObserver {
  constructor(public callback: IntersectionObserverCallback) {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});
