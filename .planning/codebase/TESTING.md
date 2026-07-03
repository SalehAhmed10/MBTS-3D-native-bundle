# Testing Patterns

**Analysis Date:** 2026-07-03

## Test Framework

**Current State:** Not detected

**Runner:**
- Not installed or configured
- No Jest, Vitest, or other test runner in package.json

**Assertion Library:**
- Not applicable (no testing framework present)

**Run Commands:**
```bash
# Currently no test commands available
# Add test script to package.json when testing is implemented
```

## Test File Organization

**Current State:** No test files exist in codebase

**Recommended Location (when testing is added):**
- Co-located pattern: Place `*.test.tsx` or `*.spec.tsx` next to source files
- Example structure:
  ```
  src/
  ├── hooks/
  │   ├── useSpeech.ts
  │   ├── useSpeech.test.ts          ← Test file
  │   ├── useAuthFlow.ts
  │   └── useAuthFlow.test.ts        ← Test file
  ├── stores/
  │   ├── chatStore.ts
  │   ├── chatStore.test.ts          ← Test file
  │   └── avatarStore.ts
  └── types/
      └── (types rarely need tests)
  ```

**Naming Convention (when implemented):**
- Source file `useAuthFlow.ts` → Test file `useAuthFlow.test.ts`
- Source file `chatStore.ts` → Test file `chatStore.test.ts`
- Pattern: `[source-name].test.ts` or `[source-name].spec.ts`

## Test Structure

**Recommended Pattern:**
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useAuthFlow } from '@/hooks/useAuthFlow';

describe('useAuthFlow', () => {
  it('should handle name messages', () => {
    // Arrange
    const addAvatarMessage = jest.fn();
    const { result } = renderHook(() => useAuthFlow(addAvatarMessage));

    // Act
    act(() => {
      result.current.handleNameMessage('John');
    });

    // Assert
    expect(addAvatarMessage).toHaveBeenCalled();
  });
});
```

**Test Suite Organization:**
- Use `describe()` blocks by module/feature
- One test per behavior/scenario
- Clear names: `it('should [behavior] when [condition]', ...)`
- Setup/teardown as needed (not currently required)

## Mocking

**Framework:** Not configured

**Recommended Setup (when testing is added):**
- Jest mocking for external dependencies
- Mock Zustand stores for component tests
- Mock fetch calls for API testing

**Patterns to Implement:**

### Mocking Fetch Calls:
```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ reply: 'test response' }),
  })
);
```

### Mocking Zustand Stores:
```typescript
import { useChatStore } from '@/stores/chatStore';

jest.mock('@/stores/chatStore', () => ({
  useChatStore: jest.fn((selector) =>
    selector({
      messages: [],
      addMessage: jest.fn(),
    })
  ),
}));
```

### Mocking React Query:
```typescript
import { useMutation } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isLoading: false,
    error: null,
  })),
}));
```

**What to Mock:**
- External API calls (fetch)
- Zustand stores (in component tests)
- React Query mutations
- Native modules (e.g., `expo-audio` if testing audio integration)
- AsyncStorage/MMKV storage calls
- Timer functions (setTimeout, setInterval)

**What NOT to Mock:**
- Zustand stores in hook unit tests (test the actual store integration)
- Business logic functions (test them directly)
- Type helpers/utilities (no value in mocking)
- Navigation if testing navigation-aware components (use context)

## Fixtures and Factories

**Current State:** No fixtures directory exists

**Recommended Location (when testing is added):**
```
src/
├── __fixtures__/
│   ├── chatMessages.ts
│   ├── users.ts
│   └── avatarOptions.ts
└── __mocks__/
    ├── handlers.ts         # MSW request handlers
    └── stores.ts           # Mock store creators
```

**Factory Pattern (Recommended):**
```typescript
// src/__fixtures__/chatMessages.ts
export function createChatMessage(overrides?: Partial<ChatMessage>): ChatMessage {
  return {
    id: 'msg-1',
    message: 'Test message',
    me: false,
    ...overrides,
  };
}

// In tests:
const message = createChatMessage({ me: true });
const messages = [createChatMessage(), createChatMessage({ me: true })];
```

**Test Data Organization:**
- One fixture file per major type (e.g., `users.ts`, `chatMessages.ts`, `avatarOptions.ts`)
- Factory functions for customizable test data
- Constants for common test values (IDs, strings, etc.)

## Coverage

**Requirements:** Not enforced

**Current State:**
- No coverage configuration
- No coverage reporting

**Recommended Target (when testing is added):**
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

**View Coverage (when configured):**
```bash
npm test -- --coverage
# or with Jest:
jest --coverage
```

## Test Types

**Unit Tests (Recommended Focus):**
- Zustand stores: test state initialization and mutations
  - Example: `chatStore.test.ts` - test `addMessage()`, `resetAuthFlow()`
- Utility functions: test pure functions with various inputs
  - Example: `useAuthFlow.test.ts` - test `handleNameMessage()`, `handleAuthMessage()`
- Hooks: test with `@testing-library/react-hooks`
  - Test side effects, state updates, and cleanup

**Integration Tests (Secondary):**
- Store interactions with multiple slices
- Fetch calls with real error scenarios
- Auth flow: name entry → intent → authentication sequence

**E2E Tests (Not Currently Configured):**
- Framework: Could use Detox or Maestro for React Native
- Scope: Full user flows (enter name → authenticate → chat)
- Not a current priority; focus on unit tests first

## Common Patterns

**Async Testing:**
```typescript
it('should fetch and cache speech', async () => {
  const { result } = renderHook(() => useSpeech(params));

  await act(async () => {
    // Call async operation
  });

  expect(result.current.isPlaying).toBe(true);
});
```

**Error Testing:**
```typescript
it('should handle network errors gracefully', async () => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error('Network error'))
  );

  const { result } = renderHook(() => useGetPerson());

  await act(async () => {
    try {
      await result.current.mutateAsync(mockUser);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});
```

**Zustand Store Testing:**
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useChatStore } from '@/stores/chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.getState().resetAuthFlow();
  });

  it('should add message to store', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.addMessage({
        id: 'msg-1',
        message: 'Test',
        me: true,
      });
    });

    expect(result.current.messages).toHaveLength(1);
  });
});
```

**Hook Testing Pattern:**
```typescript
import { renderHook, act } from '@testing-library/react-native';

it('should update input when text changes', () => {
  const addMessage = jest.fn();
  const { result } = renderHook(() => useChatStore());

  act(() => {
    result.current.setInput('Hello');
  });

  expect(result.current.input).toBe('Hello');
});
```

## Testing Priorities

**Recommended Order of Implementation:**

1. **High Priority - Unit Tests:**
   - `src/stores/chatStore.ts` - State management core
   - `src/hooks/useAuthFlow.ts` - Complex business logic
   - `src/hooks/useSendMessage.ts` - API integration

2. **Medium Priority:**
   - `src/hooks/useSpeech.ts` - Caching and prefetch logic
   - `src/utils/speechCache.ts` - If it exists
   - Type validation in API response handlers

3. **Lower Priority:**
   - Individual components (require more setup)
   - E2E testing of full flows
   - Native module integration tests

## Missing Test Infrastructure

**What Needs to Be Added:**
- [ ] Test runner installation (Jest recommended for React Native)
- [ ] Test assertion library (Jest includes this)
- [ ] Testing utilities for React Native (`@testing-library/react-native`)
- [ ] Setup file for test environment configuration
- [ ] Mock handlers for external APIs
- [ ] Fixture/factory files for test data
- [ ] GitHub Actions CI/CD configuration for test runs

**Setup Script (Recommended):**
```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-mock-extended
```

**jest.config.js (Recommended):**
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__fixtures__/**',
  ],
};
```

---

*Testing analysis: 2026-07-03*
