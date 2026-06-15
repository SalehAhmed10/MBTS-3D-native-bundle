# Coding Conventions

**Analysis Date:** 2026-06-15

## Language Split: Critical Context

This codebase has **two coexisting layers** with completely different conventions:

- **New layer (TypeScript):** `src/app/`, `src/components/*.tsx`, `src/hooks/`, `src/utils/speechCache.ts`, `src/constants/`, `src/types/` — typed, modern
- **Legacy layer (JavaScript):** `src/screens/`, `src/components/xshare/`, `src/redux/`, `src/services/`, `src/components/avatar/AvatarWebView.js`, `src/components/legacy-mbts-app.js` — untyped, older patterns

All new code must go into the TypeScript layer. The legacy `.js` files are not being converted; they are retained as-is.

---

## TypeScript Strictness

**Config:** `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/assets/*": ["./assets/*"]
    }
  }
}
```

- `strict: true` enables all strict checks (`strictNullChecks`, `noImplicitAny`, etc.)
- `allowJs: true` — legacy `.js` files are allowed in the build
- `checkJs: false` — JS files are NOT type-checked; only `.ts`/`.tsx` files get strict checking
- TypeScript version: `~6.0.3`

**Practical result:** TypeScript strictness applies only to the new layer. The legacy layer has zero type enforcement.

---

## ESLint Configuration

**Config:** `eslint.config.js`

```js
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  }
]);
```

- Uses `eslint-config-expo` flat config (Expo's opinionated ruleset)
- No custom rules added beyond the Expo preset
- No Prettier config present; formatting is not enforced by tooling
- Run via: `npm run lint` → `expo lint`

No `.prettierrc`, no Biome, no `@typescript-eslint` custom rules beyond what `eslint-config-expo` includes.

---

## Naming Patterns

**Files (TypeScript layer):**
- Components: `kebab-case.tsx` — e.g., `animated-icon.tsx`, `native-avatar-speech.tsx`, `themed-text.tsx`
- Platform variants: `component-name.web.tsx` — e.g., `animated-icon.web.tsx`, `app-tabs.web.tsx`
- Hooks: `use-kebab-case.ts` — e.g., `use-color-scheme.ts`, `use-theme.ts`
- Utilities: `camelCase.ts` — e.g., `speechCache.ts`
- Constants: `kebab-case.ts` — e.g., `theme.ts`
- Type declarations: `PascalCase.d.ts` — e.g., `AvatarWebView.d.ts`

**Files (Legacy JS layer):**
- Components: `PascalCase.js` — e.g., `UpdateShoppingListModal.js`, `AddPhoneNumberModal.js`
- Screens: `PascalCase.js` — e.g., `Home.js`, `AvatarSelection.js`
- Redux slices: `camelCaseSlice.js` — e.g., `personSlice.js`, `xShareSlice.js`
- Redux store: `store.js`

**Functions and variables:**
- New TS layer: `camelCase` functions, `PascalCase` components, `UPPER_SNAKE_CASE` constants
- Legacy JS layer: `camelCase` throughout; no consistent constant casing

**Types (TS layer):**
- Inline `type` declarations (not `interface`) — e.g., `type AvatarOption = { ... }`
- Named with `PascalCase`
- Props types follow `ComponentNameProps` convention — e.g., `NativeAvatarSpeechProps`, `FilamentPreviewProps`

---

## Component Patterns

All components are **functional components**. No class components in either layer.

**TypeScript layer patterns:**

```tsx
// Named export for most components
export function FilamentPreview({ avatarId = "prithi", ... }: FilamentPreviewProps) {
  // ...
}

// Default export required for expo-router route files
export default function HomeScreen() {
  // ...
}

// memo() wrapping for performance-sensitive components
export const NativeAvatarSpeech = memo(NativeAvatarSpeechComponent);
```

**Legacy JS layer patterns:**

```js
// Default export only
export default function LegacyMbtsApp() { ... }

// React imported explicitly (old-style)
import React, { useState, useEffect, useRef } from 'react';

// forwardRef used in JS (AvatarWebView.js)
const AvatarWebView = forwardRef(({ avatar, ... }, ref) => { ... });
```

---

## Hooks Usage

**Custom hooks (TypeScript layer):**

- `useTheme()` — `src/hooks/use-theme.ts` — returns color tokens for current color scheme
- `useColorScheme()` — `src/hooks/use-color-scheme.ts` — re-exports from `react-native`

Hook filenames use `use-kebab-case.ts`. All hooks prefixed `use`.

**Standard hooks in `src/app/index.tsx`:**
`useState`, `useEffect`, `useCallback`, `useRef` from React; `useSafeAreaInsets` from `react-native-safe-area-context`.

**Pattern: `useEffect` with cancellation flags (used consistently):**

```tsx
let isCancelled = false;

const run = async () => {
  try {
    if (isCancelled) return;
    // ... update state
  } catch (error) {
    if (isCancelled) return;
  }
};

void run();

return () => { isCancelled = true; };
```

**`void` prefix on floating promises:**
All fire-and-forget async calls use `void`: `void run()`, `void playSpeech()`, `void prefetch()`. This is consistent throughout the TypeScript layer.

---

## Import Patterns

**Path alias `@/` maps to `src/`** (defined in `tsconfig.json`):

```tsx
// Preferred in TS layer
import { SPEECH_SYNTHESIS_ENDPOINT } from "@/config";
import AvatarWebView from "@/components/avatar/AvatarWebView";
import { cacheSpeech, getCachedSpeech } from "@/utils/speechCache";
import { Colors } from '@/constants/theme';
```

**Import ordering (observed, not enforced by tooling):**
1. React / React Native core
2. Third-party libraries
3. Internal `@/` alias imports

**Legacy JS layer uses relative paths only:**

```js
import { baseURL } from '../utils/api';
import store, { persistor } from '../redux/store/store';
```

**Named vs default exports:**
- `expo-router` page files: `export default` (required)
- TS components: named exports preferred (`export function FilamentPreview`)
- Legacy JS: `export default` throughout

---

## State Management Patterns

**Two coexisting approaches:**

**1. Local component state — TypeScript layer (`src/app/index.tsx`):**

All state is component-local `useState`. No Redux in the main chat screen. Covers: messages, speech queue, avatar/voice/emotion selection, auth flow steps, user session.

**2. Redux Toolkit + redux-persist — Legacy layer (`src/redux/`):**

```js
// src/redux/store/store.js
const store = configureStore({
  reducer: persistedReducer,   // redux-persist wrapping MMKV
  middleware: getDefaultMiddleware => getDefaultMiddleware({
    serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
  }),
});
```

Slices: `src/redux/slices/personSlice.js`, `postSlice.js`, `xShareSlice.js`
Used in: `src/screens/Home.js` via `useSelector`/`useDispatch`

The new `src/app/index.tsx` does NOT use Redux. The legacy `src/screens/Home.js` requires Redux for person/package data via the `<StoreProvider>` in `src/components/legacy-mbts-app.js`.

---

## Error Handling Patterns

**TypeScript layer — `try/catch/finally` with `instanceof Error`:**

```tsx
try {
  await someAsyncOperation();
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : "Fallback message";
  addAvatarMessage(message);
} finally {
  setIsReplying(false);
}
```

**HTTP error handling — explicit `response.ok` check before reading body:**

```tsx
if (!response.ok) {
  throw new Error(responseJson?.message || `Service failed with ${response.status}`);
}
```

**Silent catch for non-critical paths (cache reads):**

```ts
try {
  // cache read
} catch {
  return null;
}
```

**`LogBox.ignoreAllLogs()` is called globally in `src/app/_layout.tsx`** — all React Native warnings and errors are suppressed at the OS level. This is a production quality concern; crashes and warnings won't surface in the UI.

---

## Async Patterns

**`async/await` is used exclusively** in the TypeScript layer. No `.then()`/`.catch()` chains in new code.

**`response.json()` fallback pattern to prevent crashes:**

```tsx
const responseJson = (await response.json().catch(() => ({}))) as IntentResponse;
```

Used in multiple places in `src/app/index.tsx`. Prevents crashes on malformed/empty API responses.

**Legacy JS layer** mixes `async/await` with `.then()` chains in `src/screens/Home.js` and `src/redux/slices/`.

---

## Environment Variable Handling

**Config file:** `src/config.js` (JavaScript, not TypeScript)

```js
export const MBTS_API_URL =
  process.env.EXPO_PUBLIC_MBTS_API_URL ||
  "https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/";
```

- All env vars use the `EXPO_PUBLIC_` prefix (required by Expo for client-side bundling)
- All env vars have **hardcoded staging server fallbacks** — the app works without any `.env` file
- Feature flags are hardcoded objects in `config.js`, not env-driven
- No runtime env validation (no Zod schema, no assertion guards)

**Risk:** The hardcoded staging Heroku URL is the production fallback. Any build without an override hits staging infrastructure.

---

## Styling Patterns

**`StyleSheet.create()` is used exclusively.** No inline style object literals, no styling libraries (no NativeWind, no Styled Components, no Tamagui).

```tsx
const styles = StyleSheet.create({
  container: { backgroundColor: "#ffffff", flex: 1 },
});
```

**Colors are hardcoded hex values** directly in `StyleSheet.create()` throughout `src/app/index.tsx`. The `Colors` token object in `src/constants/theme.ts` exists but is only consumed by `useTheme()` and the `ThemedText`/`ThemedView` components — not by the main screen or most other components.

**Platform branching:**

```tsx
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} />
```

---

## Logging

**All logging uses `console.log()`** — no structured logger, no log levels, no stripping in production (beyond `LogBox.ignoreAllLogs()`).

**Prefixed tags in new TypeScript code:**
- `[HomeScreen][AvatarWebView][speech-error]`
- `[NativeAvatarSpeech] cache:hit`
- `[speechCache] hit:`
- `[AvatarWebView]`

**Legacy JS has unprefixed `console.log` scattered throughout `src/screens/Home.js`** (50+ statements), including debug dumps like `console.log('///////////////////////////////////////////////////')` and `console.log('person ---------->', person)`.

---

## Code Organization Consistency

**Consistency rating: Low.** Two complete paradigms coexist without consolidation:

| Dimension | New Layer | Legacy Layer |
|---|---|---|
| Language | TypeScript (`.tsx`/`.ts`) | JavaScript (`.js`) |
| File naming | `kebab-case` | `PascalCase` |
| State | Local `useState` | Redux + persist |
| Navigation | `expo-router` file-based | Stub `navigation` prop |
| Imports | `@/` alias | Relative paths |
| Async | `async/await` only | Mixed |

**Additional inconsistencies:**
- `src/config.js` is JavaScript while all surrounding TypeScript files import it
- `src/components/avatar/AvatarWebView.js` has a hand-maintained `AvatarWebView.d.ts` type stub — types must be kept in sync manually with the JS implementation
- `src/utils/speechCache.ts` and `src/components/native-avatar-speech.tsx` both implement TTS caching with separate hash functions and cache key schemes — duplicated logic, risk of divergence
- `Spacing` tokens in `src/constants/theme.ts` use non-numeric names (`half=2`, `one=4`, `two=8`, `three=16`) — confusing and inconsistently adopted

---

*Convention analysis: 2026-06-15*
