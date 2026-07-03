# Coding Conventions

**Analysis Date:** 2026-07-03

## Naming Patterns

**Files:**
- React components and hooks: kebab-case with `.tsx` or `.ts` extension
  - Examples: `animated-icon.tsx`, `use-color-scheme.ts`, `themed-text.tsx`
  - Store files: PascalCase followed by domain (e.g., `chatStore.ts`, `avatarStore.ts`)
- Type definition files: snake_case or domain-based naming
  - Examples: `chat.ts`, `avatar.ts`, `assets.d.ts`

**Functions:**
- camelCase for all function names, both exported and internal
  - Examples: `addMessage()`, `sendMessage()`, `handleAuthMessage()`, `useAuthFlow()`
  - Hook names: prefixed with `use` (e.g., `useChatStore()`, `useSpeech()`, `useAuthFlow()`)
  - Utility functions: camelCase (e.g., `normalizeAvatarMessage()`, `getPersistedBackground()`)

**Variables:**
- camelCase for all local and state variables
  - Examples: `guestName`, `selectedAvatarId`, `isReplying`, `conversationHistory`
  - Boolean flags: `is*` prefix (e.g., `isReplying`, `isSelectorOpen`)
  - Ref objects: `*Ref` suffix (e.g., `scrollViewRef`, `lastDispatchedRef`)

**Types:**
- PascalCase for all type definitions
  - Interface patterns: `interface ChatStore { ... }`
  - Type aliases: `type ChatMessage = { ... }`
  - Examples: `CandidateUser`, `AvatarOption`, `AuthProperty`, `ConversationTurn`

**Constants:**
- UPPER_SNAKE_CASE for all constants and configuration values
  - Examples: `AUTH_PROPERTIES`, `DEFAULT_AVATAR_ID`, `CHAT_API_URL`, `SPEECH_HEALTH_ENDPOINT`
  - Configuration arrays: same pattern (e.g., `EMOTION_OPTIONS`, `BACKGROUND_OPTIONS`)
  - Hardcoded values in constants: same pattern (e.g., `AUTH_FAILURE_PROMPT`)

## Code Style

**Formatting:**
- No Prettier configuration detected; using ESLint's built-in formatting rules
- Indent: 2 spaces (enforced by ESLint config-expo)
- Line length: No explicit limit observed in code
- Semicolons: Required (enforced by ESLint)
- Quotes: Double quotes for strings (enforced by ESLint)

**Linting:**
- Tool: ESLint 9.0.0 with `eslint-config-expo` (~56.0.4)
- Config location: `eslint.config.js` (flat config format)
- Run command: `npm run lint` or `expo lint`
- Default ignores: `dist/*`

## Import Organization

**Order:**
1. React core and React Native imports
2. Third-party library imports (expo-*, react-native-*, @react-navigation/*, etc.)
3. Local absolute imports using path aliases (`@/...`)
4. Local relative imports (rarely used)

**Pattern:**
```typescript
// React and React Native
import { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';

// Third-party libraries
import { create } from 'zustand';
import { useMutation } from '@tanstack/react-query';
import Animated, { useAnimatedKeyboard } from 'react-native-reanimated';

// Local imports with path aliases
import { useChatStore } from '@/stores/chatStore';
import type { ChatMessage, AuthProperty } from '@/types/chat';
import { mmkvStorage } from '@/utils/mmkv';
```

**Path Aliases:**
- `@/*` → `./src/*` (primary alias for all source code)
- `@/assets/*` → `./assets/*` (secondary alias for assets)
- Used in all imports across the codebase
- TypeScript configuration: `tsconfig.json` with strict mode enabled

## Error Handling

**Patterns:**
- Try-catch blocks for async operations
- Fallback return values with `.catch(() => (defaultValue))`
- Network errors: JSON parsing failures caught and replaced with empty objects
  - Example: `(await response.json().catch(() => ({}))) as ResponseType`
- User-visible errors: wrapped in try-catch-finally with user messages
- Silent errors: console.log for non-critical failures (e.g., speech synthesis prefetch)

**Example Pattern:**
```typescript
try {
  const result = await fetchData();
  // handle success
} catch (err) {
  const message = err instanceof Error ? err.message : 'Default error message';
  addAvatarMessage(message);
} finally {
  setIsReplying(false);
}
```

**Response Validation:**
- Check `response.ok` before processing
- Validate response type/status fields from API responses
- Example: `if (!response.ok || json.type !== 'person' || json.status !== 'OK')`

## Logging

**Framework:** Native `console` object (no logging library)

**Patterns:**
- `console.log()` for error diagnostics and debug info
- Formatted with context tags: `[functionName][type]` prefix
  - Example: `console.log('[useSpeech][error]', err)`
- Used minimally; mostly in error paths
- No info/warn/debug levels used

## Comments

**When to Comment:**
- Complex business logic: logic explaining WHY, not WHAT (see `useAuthFlow.ts`)
- Algorithm explanations: how matching/filtering works
- Prefetch logic: explaining optimization strategies
- Generally minimal; code is self-documenting through naming

**JSDoc/TSDoc:**
- Not systematically used in source code
- Type-driven documentation: TypeScript types replace most comments
- Interface/type exports are self-documenting

**Example of Good Comments:**
```typescript
// Prefetch next speech item while current plays.
useEffect(() => {
  if (!nextSpeech?.text) return;
  // ... prefetch logic
}, [nextSpeech?.id, nextSpeech?.text, selectedAvatar.id, /* ... */]);
```

## Function Design

**Size:**
- Most functions 10-50 lines (seen in hooks like `useSpeech`, `useAuthFlow`)
- Larger functions reserved for components with complex UI logic (e.g., `HomeScreen` is 1017 lines but heavily UI)
- Favor extracting utilities and logic into separate functions

**Parameters:**
- Destructured parameters for multiple related values
  - Example: `({ avatarWebViewRef, selectedAvatar, selectedEmotionId, selectedVoice }: UseSpeechParams)`
- Use TypeScript interfaces for parameter groups (e.g., `UseSpeechParams`)
- Single parameter if only one value needed

**Return Values:**
- Explicit return types via TypeScript
- Functions return objects for multiple values (e.g., hooks return `{ isPlaying: ... }`)
- Promise types explicitly declared in async functions

**Example Function:**
```typescript
function getLimit(property: AuthProperty): number {
  return property === 'mothersMaidenName' ? 50 : 30;
}

const addAvatarMessage = useCallback((message: string) => {
  const id = `${Date.now()}-avatar`;
  const normalized = normalizeAvatarMessage(message);
  addMessage({ id, message: normalized, me: false });
  addSpeechItem({ id, text: normalized });
}, [addMessage, addSpeechItem]);
```

## Module Design

**Exports:**
- Named exports for utilities and hooks
- Default exports for components (React convention)
- Type exports using `export type` syntax
- Constants exported as named exports

**Barrel Files:**
- Not used; imports always direct to source file
- Example: `import { useChatStore } from '@/stores/chatStore'` (not from `@/stores`)

**Store Pattern (Zustand):**
- Create store with interface defining all state and setters
- All mutations are action functions on the store
- No thunks or middleware; direct state updates via `set()`
- Example from `chatStore.ts`:
  ```typescript
  interface ChatStore {
    messages: ChatMessage[];
    addMessage: (msg: ChatMessage) => void;
  }
  
  export const useChatStore = create<ChatStore>((set) => ({
    messages: [],
    addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  }));
  ```

## Async & Promises

**Patterns:**
- `async/await` for all async operations (preferred over `.then()`)
- `useEffect` cleanup: cancel flag or ref to prevent stale updates
  - Example: `let cancelled = false; return () => { cancelled = true; };`
- React Query mutations (`useMutation`) for API calls with built-in loading/error states
- Void return for fire-and-forget: `void run()` or `void prefetch()`

## State Management

**Zustand Stores:**
- Located in `src/stores/` directory (e.g., `chatStore.ts`, `avatarStore.ts`)
- Immutable updates via spread operator: `{ messages: [...s.messages, msg] }`
- Persistent state via MMKV integration: `mmkvStorage.setString('key', value)`
- Used for UI state and conversation data

**React Query (TanStack Query):**
- `useMutation` for POST/write operations
- Located in hooks (e.g., `useSendMessage.ts`, `useGetPerson.ts`)
- Error handling via try-catch within `mutationFn`
- Response parsing with fallback: `.catch(() => ({}))`

**Local State:**
- `useState` for component-local UI state (modals, selections, input fields)
- `useRef` for non-rendering state (refs to WebView, cancel flags)

---

*Convention analysis: 2026-07-03*
