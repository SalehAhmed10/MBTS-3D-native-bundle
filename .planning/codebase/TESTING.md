# Testing Patterns

**Analysis Date:** 2026-07-03

## Test Framework

**Status:** Not configured

**Current State:**
- No testing framework is installed or configured
- No test runner (Jest, Vitest, etc.) found in `package.json`
- No test configuration files detected (no `jest.config.js`, `vitest.config.ts`, etc.)
- No test files exist in the codebase (searched `src/**/*.{test,spec}.{ts,tsx}`)

**Recommended Path:**
To add testing to this project, consider:
- **For React Native focus:** Install Jest with React Native preset
- **For lightweight unit tests:** Install Vitest
- **For E2E testing:** Detox (React Native) or Playwright (web)

## Test File Organization

**Location:** Not established (testing not implemented)

**When testing is added, follow patterns:**
- Co-locate test files with source: `src/hooks/__tests__/useGetPerson.test.ts` or `src/hooks/useGetPerson.test.ts`
- Alternative: Separate test directory mirroring src structure: `tests/hooks/useGetPerson.test.ts`

**Naming Convention (to use when added):**
- Test files: `{FileName}.test.ts` or `{FileName}.spec.ts`
- Test directories: `__tests__` subdirectories within source

## Test Structure

**Current Implementation:** Not applicable (no tests exist)

**Expected Structure (when added):**

Likely patterns based on codebase style:

```typescript
// For hooks (e.g., useGetPerson.test.ts)
describe('useGetPerson', () => {
  it('should fetch person data successfully', async () => {
    // Arrange
    // Act
    // Assert
  });

  it('should throw error on invalid response', async () => {
    // Arrange
    // Act
    // Assert
  });
});

// For stores (e.g., chatStore.test.ts)
describe('chatStore', () => {
  it('should initialize with default state', () => {
    // Arrange
    const store = useChatStore.getState();
    // Assert
    expect(store.messages).toEqual([]);
  });

  it('should add message to store', () => {
    // Arrange
    const msg = { id: '1', message: 'test', me: true };
    // Act
    useChatStore.getState().addMessage(msg);
    // Assert
    expect(useChatStore.getState().messages).toContainEqual(msg);
  });
});

// For utilities (e.g., speechCache.test.ts)
describe('speechCache', () => {
  it('should cache and retrieve speech payload', async () => {
    // Arrange
    const payload = { audioBase64: '...' };
    // Act
    cacheSpeech('hello', 'avatar1', 'voice1', payload);
    const cached = await getCachedSpeech('hello', 'avatar1', 'voice1');
    // Assert
    expect(cached).toEqual(payload);
  });

  it('should return null for uncached speech', async () => {
    // Arrange & Act
    const cached = await getCachedSpeech('unknown', 'avatar1', 'voice1');
    // Assert
    expect(cached).toBeNull();
  });
});
```

## Mocking

**Framework:** Not installed (testing not configured)

**When testing is added, plan for:**

**Mock Patterns for This Codebase:**

1. **API Mocks** (for hooks like `useGetPerson`, `useSendMessage`):
   - Mock `fetch` globally or per test
   - Simulate `response.ok`, `response.json()`, etc.
   - Example needed: `src/hooks/useGetPerson.ts` makes POST to `${baseURL}users/getPersonById`
   - Example needed: `src/hooks/useSendMessage.ts` makes POST to `https://www.chatcierge.ai/api/chat`

2. **Store Mocks** (for Zustand stores):
   - Use `useAvatarStore.getState()` and `useChatStore.getState()` directly in tests (stores are already set up for this)
   - Reset store state between tests: `act(() => { useChatStore.setState({...initialState}) })`
   - No mocking library needed; Zustand supports direct state manipulation

3. **React Query Mocks** (for mutation hooks):
   - Mock or disable `@tanstack/react-query` QueryClient in tests
   - Replace with test QueryClient with `gcTime: 0` to disable caching
   - Example: `src/hooks/useGetPerson.ts` uses `useMutation()` from React Query

4. **File System Mocks** (for utilities):
   - Mock `expo-file-system` File/Paths APIs for `src/utils/speechCache.ts`
   - Mock `file.exists`, `file.json()`, `file.write()`, `file.delete()`
   - Example test: verify cache miss when file doesn't exist, cache hit when file exists

5. **MMKV Storage Mocks** (for persistent storage):
   - Mock `react-native-mmkv-storage` for tests touching `src/utils/mmkv.js`
   - Example: `src/stores/avatarStore.ts` persists `selectedBackgroundId` via `mmkvStorage.setString()`

**What NOT to Mock:**
- Pure utility functions (e.g., `hashKey()` in `speechCache.ts` - test it directly)
- Type definitions (they're data structures, not behavior)
- Zustand store selectors (use real stores or reset state between tests)

## Fixtures and Factories

**Test Data:** Not established

**When testing is added, create fixtures for:**

```typescript
// Example: tests/fixtures/avatar.ts
export const mockAvatarOption = {
  id: 'camilia',
  label: 'Camille',
  available: true,
  voice: { id: 'camilia-default', label: 'Camille Default' },
  defaultVoiceId: 'camilia-default',
};

export const mockCandidateUser = {
  _id: 'user123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  homeCity: 'NYC',
};

// Example: tests/fixtures/chat.ts
export const mockChatMessage = {
  id: 'msg1',
  message: 'Hello',
  me: true,
};

export const mockSpeechQueueItem = {
  id: 'speech1',
  text: 'Hello, how are you?',
};
```

**Location (to establish):**
- Create `tests/fixtures/` directory
- Group by domain: `fixtures/avatar.ts`, `fixtures/chat.ts`, `fixtures/user.ts`
- Export factory functions for flexibility:
  ```typescript
  export function createAvatarOption(overrides?: Partial<AvatarOption>): AvatarOption {
    return { ...mockAvatarOption, ...overrides };
  }
  ```

## Coverage

**Requirements:** Not enforced (no testing infrastructure exists)

**When testing is added, recommend:**
- Minimum coverage: 70% for critical paths (authentication, speech synthesis, API calls)
- Focus areas:
  - Hooks: `useGetPerson`, `useSendMessage`, `useAuthFlow`, `useSpeech` (complex async logic)
  - Stores: State mutations and selectors
  - Utilities: `speechCache` caching logic, `hashKey` collision resistance
  - Types: Validation shapes (if validation is added)

**View Coverage (when configured):**
```bash
npm test -- --coverage
# Or with specific framework:
jest --coverage
vitest --coverage
```

## Test Types

**Unit Tests (planned):**
- Scope: Individual functions and hooks
- Approach: Mock external dependencies (fetch, file system, stores)
- Examples to test:
  - `useGetPerson()` - mutation request/response handling
  - `useSendMessage()` - API call and state update
  - `getCachedSpeech()` / `cacheSpeech()` - file operations
  - `useAuthFlow()` - authentication step logic
  - Store mutations: `addMessage()`, `setSelectedAvatarId()`, etc.

**Integration Tests (planned, lower priority):**
- Scope: Multiple components working together
- Approach: Render components with real stores, mock only external APIs
- Examples:
  - Speech synthesis flow: fetch data → cache → play audio
  - Authentication flow: name input → intent detection → auth challenge
  - Chat message: send message → get response → add to store → trigger speech

**E2E Tests (planned, not urgent):**
- Framework: Detox (React Native) or Playwright (web)
- Scope: Full user flows
- Examples:
  - User enters name → receives greeting → sends message → avatar responds
  - Background selection → background updates in UI
  - Voice selection → speaking uses correct voice

## Common Patterns to Test

**Async Testing (when testing added):**
```typescript
// Using standard patterns with async/await
it('should handle async mutation', async () => {
  const { result } = renderHook(() => useGetPerson());
  
  await act(async () => {
    await result.current.mutateAsync(mockUser);
  });
  
  expect(result.current.isSuccess).toBe(true);
});

// Or with then/catch
it('should set authenticated on success', async () => {
  const mutation = useMutation({...});
  
  return mutation.mutateAsync(user).then(() => {
    expect(store.authenticated).toBe(true);
  });
});
```

**Error Testing (when testing added):**
```typescript
it('should throw on bad response', async () => {
  global.fetch = jest.fn(() => 
    Promise.resolve({ ok: false, status: 401 })
  );
  
  const mutation = useMutation({...});
  
  await expect(
    mutation.mutateAsync(mockUser)
  ).rejects.toThrow('Identity verification failed');
});

it('should handle cache errors gracefully', async () => {
  // Mock file system to throw
  jest.spyOn(File.prototype, 'json').mockRejectedValueOnce(new Error('Read failed'));
  
  const result = await getCachedSpeech('text', 'avatar', 'voice');
  
  expect(result).toBeNull(); // Should return null, not throw
});
```

**Store Testing (when testing added):**
```typescript
it('should persist avatar selection', () => {
  const store = useChatStore.getState();
  
  act(() => {
    store.setGuestName('Alice');
  });
  
  expect(useChatStore.getState().guestName).toBe('Alice');
});

it('should reset auth flow', () => {
  // Setup store with auth data
  act(() => {
    useChatStore.setState({
      authenticated: true,
      currentAuthProp: 'favoriteColor',
    });
  });
  
  // Reset
  act(() => {
    useChatStore.getState().resetAuthFlow();
  });
  
  // Verify reset
  const state = useChatStore.getState();
  expect(state.authenticated).toBe(false);
  expect(state.currentAuthProp).toBeNull();
});
```

---

*Testing analysis: 2026-07-03*
