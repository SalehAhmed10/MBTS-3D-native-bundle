# Coding Conventions

**Analysis Date:** 2026-07-03

## Naming Patterns

**Files:**
- Hook files: Inconsistent - some use kebab-case (`use-color-scheme.ts`, `use-theme.ts`), others use camelCase (`useGetPerson.ts`, `useSpeech.ts`, `useAuthFlow.ts`, `useSendMessage.ts`). Newer hooks prefer camelCase.
- Component files: PascalCase (`AnimatedIcon.tsx`, `ThemedText.tsx`, `AppTabs.tsx`)
- Store files: camelCase with "Store" suffix (`avatarStore.ts`, `chatStore.ts`)
- Type files: camelCase describing the domain (`avatar.ts`, `chat.ts`)
- Utility files: camelCase (`speechCache.ts`, `mmkv.js`)

**Functions:**
- Hook functions: Prefix with "use" in camelCase (e.g., `useGetPerson()`, `useSpeech()`, `useAuthFlow()`, `useSendMessage()`)
- Helper functions: camelCase (e.g., `buildHelloMessage()`, `getPersistedBackground()`, `getCachedSpeech()`, `cacheSpeech()`, `hashKey()`)
- Function names are descriptive and represent what they do

**Variables:**
- Local variables: camelCase (`selectedAvatar`, `conversationHistory`, `lastDispatchedRef`, `activeSpeech`, `nextSpeech`)
- State variables: camelCase (`chatStep`, `guestName`, `authenticated`, `isReplying`)
- Ref objects: camelCase with "Ref" suffix (`avatarWebViewRef`, `lastDispatchedRef`)

**Types:**
- Type definitions: PascalCase (e.g., `ChatMessage`, `AvatarOption`, `PersonResponse`, `ChatApiResponse`, `CandidateUser`, `ConversationTurn`, `AvatarEvent`)
- Interface definitions: PascalCase (e.g., `AvatarWebViewRef`, `UseSpeechParams`, `ChatStore`, `AvatarStore`)
- Enum/union types: PascalCase (e.g., `AuthProperty`, `ChatStep`)
- Type property names: camelCase

**Constants:**
- Module-level constants: UPPER_SNAKE_CASE (`CACHE_PREFIX`, `AUTH_PROPERTIES`, `AUTH_FAILURE_PROMPT`, `DEFAULT_AVATAR_ID`, `SPEECH_SYNTHESIS_ENDPOINT`, `SPEECH_HEALTH_ENDPOINT`, `CHAT_API_URL`, `DEFAULT_AVATAR_OPTIONS`, `EMOTION_OPTIONS`, `BACKGROUND_OPTIONS`, `INITIAL_SCALE_FACTOR`, `DURATION`, `MaxContentWidth`, `BottomTabInset`)
- Array constants: UPPER_SNAKE_CASE (e.g., `CDN_BACKGROUNDS`, `AUTH_PROPERTIES`)

## Code Style

**Formatting:**
- No Prettier config detected
- Uses ESLint with `eslint-config-expo` for linting
- TypeScript strict mode enabled in `tsconfig.json`
- 2-space indentation (observed in source files)

**Linting:**
- ESLint configuration: `eslint.config.js` using flat config format
- Extends: `eslint-config-expo`
- Ignores: `dist/*`
- Run: `npm run lint` (executes `expo lint`)

**Type Strictness:**
- TypeScript `strict: true` in `tsconfig.json`
- `allowJs: true` (allows mixing .js and .ts files)
- `checkJs: false` (doesn't check JavaScript files)
- All exports include explicit type annotations where appropriate (e.g., function return types)

## Import Organization

**Order:**
1. React and React Native imports (e.g., `import { useEffect } from 'react'`)
2. Expo imports (e.g., `import { Image } from 'expo-image'`, `import { StatusBar } from 'expo-status-bar'`)
3. Third-party library imports (e.g., `import Animated from 'react-native-reanimated'`, `import { QueryClientProvider } from '@tanstack/react-query'`)
4. Internal imports using path aliases (e.g., `import { useChatStore } from '@/stores/chatStore'`, `import type { ChatMessage } from '@/types/chat'`)
5. Relative imports for sibling files (rare in this codebase)

**Path Aliases:**
- `@/*` → `./src/*` - Used for most internal imports
- `@/assets/*` → `./assets/*` - Used for asset imports
- Type imports: Use `import type { TypeName }` for type-only imports (e.g., `import type { CandidateUser, PersonResponse } from '@/types/chat'`)

**Import grouping in practice:**
```typescript
// First: React/React Native
import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

// Second: Expo
import { Image } from 'expo-image';

// Third: Third-party
import { useMutation } from '@tanstack/react-query';
import Animated from 'react-native-reanimated';

// Fourth: Internal (stores, hooks, types, utilities)
import { useChatStore } from '@/stores/chatStore';
import { useGetPerson } from '@/hooks/useGetPerson';
import type { ChatMessage } from '@/types/chat';
import { cacheSpeech } from '@/utils/speechCache';
```

## Error Handling

**Patterns:**
- Try/catch blocks used for async operations and file I/O (e.g., `src/utils/speechCache.ts` line 37-46, `src/hooks/useSpeech.ts` line 79-84)
- Silent error handling in non-critical paths: `catch { return null }` or `catch { /* best-effort, ignore errors */ }`
- Error logging to console: `console.log('[context][error]', err)` with context prefix
- User-facing error messages: Shown via state updates that trigger UI changes
- Fallback values using nullish coalescing: `avatar?.label ?? selectedAvatarId`
- Optional chaining for safe property access: `avatarWebViewRef.current?.speakAudio()`

**Specific examples:**
- `useGetPerson.ts`: Throws error with user message if verification fails (line 20)
- `useSpeech.ts`: Silently catches TTS errors after logging (line 81), advances queue to prevent blocking
- `speechCache.ts`: All file operations wrapped in try/catch returning null on error (line 37-46, 49-62)
- `useAuthFlow.ts`: Input validation with conditional guards, user-facing messages via `addAvatarMessage()`

## Logging

**Framework:** `console` (native console API)

**Patterns:**
- Format: `console.log('[context][operation]', data)` with bracket-enclosed context
- Examples:
  - `'[speechCache] hit: ' + text.slice(0, 40)` - Cache hit logging
  - `'[speechCache] write-error'` - Error logging
  - `'[useSpeech][error]'` - Hook error logging
- Used for debugging, not for application state
- Errors logged with descriptive prefixes showing which module/operation failed

## Comments

**When to Comment:**
- Explain "why" decisions, not "what" the code does
- Clarify non-obvious algorithms or state management patterns
- Document business logic (e.g., authentication flow, emotion mapping)
- Mark work in progress or known limitations

**TSDoc/JSDoc:**
- Used for major functions and utilities
- Example from `src/constants/theme.ts`:
  ```typescript
  /**
   * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
   * There are many other ways to style your app...
   */
  ```
- Platform-specific documentation: `/** iOS UIFontDescriptorSystemDesignDefault */`

**Inline Comments:**
- Used sparingly, only when logic isn't self-documenting
- Example: `// Synthesize and play active speech item.` - describes an entire useEffect block
- Example: `// best-effort prefetch, ignore errors` - explains error handling strategy

## Function Design

**Size:** Functions are generally 10-40 lines; longer functions (70+ lines) like `useSpeech()` break functionality into logical sections with comments

**Parameters:**
- Named parameters via object destructuring for hooks: `useGetPerson()` takes no params; `useSpeech()` destructures `{ avatarWebViewRef, selectedAvatar, selectedEmotionId, selectedVoice }`
- Type-safe: All parameters have explicit TypeScript types
- Optional properties use `?:` syntax: `voice?: AvatarVoiceOption | null`

**Return Values:**
- Hooks return objects with named properties: `{ isPlaying: speechQueue.length > 0 }`
- Async functions return typed Promises: `Promise<CandidateUser>`, `Promise<WebViewSpeechPayload | null>`
- Functions return early on validation failures (guard clauses)
- Null/undefined used consistently for absent values

## Module Design

**Exports:**
- Named exports for components: `export function ThemedText(...)`
- Named exports for hooks: `export function useGetPerson()`, `export function useSpeech(...)`
- Named exports for utilities: `export async function getCachedSpeech(...)`, `export function cacheSpeech(...)`
- Type exports: `export type ChatMessage = {...}`
- Store exports: `export const useChatStore = create<ChatStore>(...)`

**Barrel Files:**
- Not extensively used; most imports directly reference specific files
- Hook files like `use-color-scheme.ts` re-export from React Native: `export { useColorScheme } from 'react-native'`

**File Organization:**
- Stores/hooks: Single export per file (store or hook)
- Types: Can contain multiple related type definitions (e.g., `avatar.ts` has `AvatarOption`, `AvatarVoiceOption`, `AvatarEvent`)
- Utilities: Single or related utility functions per file (e.g., `speechCache.ts` exports cache operations)
- Components: One component per file with StyleSheet at end

## Style Objects and Constants

**Styling Approach:**
- React Native `StyleSheet.create()` for component styles (stored as `const styles`)
- Inline style objects for animated/dynamic styles
- Theme colors imported from `@/constants/theme`
- Design tokens centralized in `theme.ts`: `Colors`, `Fonts`, `Spacing`, constants

**Constants in `theme.ts`:**
```typescript
export const Colors = { light: {...}, dark: {...} } as const;
export const Fonts = Platform.select({...});
export const Spacing = { half: 2, one: 4, ... } as const;
```

---

*Convention analysis: 2026-07-03*
