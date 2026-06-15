# Testing Patterns

**Analysis Date:** 2026-06-15

## Current Testing Status: NONE

**There are zero tests in this project.**

No test files exist in `src/`. No `jest.config.*` file exists at the project root. No `__tests__/` directories exist in `src/`. No `*.test.*` or `*.spec.*` files exist in the project (outside `node_modules`).

```
Confirmed absent:
- jest.config.js / jest.config.ts
- vitest.config.*
- src/**/__tests__/
- src/**/*.test.ts
- src/**/*.test.tsx
- src/**/*.spec.*
- Any E2E runner config (Detox, Maestro, Playwright)
```

---

## Test Framework

**Runner:** Not installed  
**Assertion library:** Not installed  
**Component testing:** Not installed  
**E2E testing:** Not installed

**No test-related packages exist in `package.json`:**
- No `jest`
- No `@testing-library/react-native`
- No `detox`
- No `maestro`
- No `vitest`
- No `@jest/globals`

**No test scripts in `package.json`:**

```json
"scripts": {
  "start": "expo start",
  "android": "expo run:android",
  "ios": "expo run:ios",
  "web": "expo start --web",
  "lint": "expo lint",
  "build:avatar-embed": "node ./scripts/build-avatar-embed.mjs"
}
```

There is no `test` script at all.

---

## Test Coverage

**Estimated coverage: 0%**

No code has automated test coverage of any kind.

---

## What IS Tested

Nothing is automatically tested.

**Manual testing appears to be the only QA method:**
- The Android build has been deployed and verified manually (evidenced by `android-local-assets/` directory and bundled WebView HTML)
- The `LogBox.ignoreAllLogs()` call in `src/app/_layout.tsx` suggests manual testing without watching for warnings
- `console.log` statements throughout the codebase (50+ in `src/screens/Home.js` alone) are dev-time debug aids used during manual testing sessions

---

## What is NOT Tested (Complete List)

Every piece of application logic is untested. The highest-risk gaps by production impact:

### Critical Gaps

**1. Authentication flow (`src/app/index.tsx`)**
- The multi-step auth challenge (name → intent → auth properties) is ~200 lines of stateful logic
- Auth property matching against API-returned candidate users uses string comparison (`nextMessage.toLowerCase().includes(expectedValue.toLowerCase())`)
- No tests verify: correct step transitions, edge cases in name validation (spaces, special chars), auth failure paths, or `resetAuthChallenge()` behavior
- **Production risk: High** — a bug in auth flow means users cannot log in

**2. Speech synthesis pipeline (`src/app/index.tsx`, `src/utils/speechCache.ts`)**
- Speech queue management with `activeSpeech`/`nextSpeech` prefetch is complex async state
- Cache key collision: `hashKey()` in `speechCache.ts` uses a simple djb2 hash; no tests verify uniqueness for real speech strings
- `cacheSpeech()` and `getCachedSpeech()` hit the real filesystem — no mock, no test
- Two separate implementations of TTS caching (`speechCache.ts` and `native-avatar-speech.tsx`) with different hash functions and no shared test coverage
- **Production risk: High** — silent cache misses or collisions cause wrong audio to play

**3. API communication (`src/app/index.tsx`)**
- `sendIntentMessage()`, `sendRequestMessage()`, `verifyPerson()` make direct `fetch()` calls
- No tests verify correct request shape, response parsing, or error handling
- `response.json().catch(() => ({}))` silently swallows parse errors — no test confirms this fallback is correct
- **Production risk: High** — malformed API responses could cause silent failures or UI freezes

**4. AvatarWebView bridge (`src/components/avatar/AvatarWebView.js`, `src/components/avatar/avatarBridge.js`)**
- JS-to-WebView message protocol is untested
- Pending message queue (messages queued before WebView is ready, then flushed on `avatar_ready`) has no test
- `buildAvatarBridgeMessage()`, `buildAvatarInjection()`, `summarizeAvatarBridgePayload()` are untested
- The `.d.ts` type stub (`AvatarWebView.d.ts`) must match the JS implementation manually — no verification
- **Production risk: High** — a message format bug silently breaks avatar speech

**5. Redux state management (`src/redux/`)**
- `personSlice.js`, `postSlice.js`, `xShareSlice.js` have no tests
- `updateAvatar` reducer mutates `state.person.user.avatarName` — if `state.person.user` is `undefined`, this throws in production
- redux-persist rehydration behavior is untested
- **Production risk: Medium** — state corruption could cause app to behave incorrectly after restart

**6. Legacy home screen (`src/screens/Home.js`)**
- ~2800-line file containing core business logic for the MBTS application
- No tests for any function — intent handling, shopping list operations, authentication, geolocation, SMS dispatch
- **Production risk: High** — largest untested surface area in the project

### Other Untested Areas

- `normalizeAvatarMessage()` — string normalization for avatar display messages
- `hydrateAvatarOptions()` — parses runtime avatar descriptors from WebView events
- `buildHelloMessage()` and all message construction utilities
- `src/services/HelperData.js` — emotion data, helper functions used throughout Home.js
- `src/utils/dateUtils.js`, `src/utils/Activity.js`, `src/utils/agreementTemplates.js`
- All modal components (`AddToShoppingListModal.js`, `ScheduleModal.js`, etc.)
- `FilamentPreview` component — 3D rendering setup, model loading states
- `AnimatedSplashOverlay` — Reanimated keyframe animation with worklet callback

---

## Production Readiness Assessment

**Testing status is a production blocker.**

### Dangerous Gaps for Production Deployment

| Risk | Area | File | Severity |
|---|---|---|---|
| Auth flow bug leaves users locked out | Multi-step auth state machine | `src/app/index.tsx` L418–466 | Critical |
| Cache hash collision plays wrong audio | TTS cache key | `src/utils/speechCache.ts` L15–21 | Critical |
| Redux mutation on undefined property | `updateAvatar` reducer | `src/redux/slices/personSlice.js` L18 | Critical |
| WebView bridge protocol drift | AvatarWebView JS↔WebView messages | `src/components/avatar/AvatarWebView.js` | High |
| Silent API error swallowing | `response.json().catch(() => ({}))` | `src/app/index.tsx` (multiple) | High |
| LogBox suppression hides crashes | Global log suppression | `src/app/_layout.tsx` L10 | High |
| Hardcoded staging URL as production fallback | Config fallback | `src/config.js` L13 | High |
| Duplicate cache implementations out of sync | Two TTS cache systems | `src/utils/speechCache.ts` vs `src/components/native-avatar-speech.tsx` | Medium |

### `LogBox.ignoreAllLogs()` — Specific Production Concern

`src/app/_layout.tsx` line 10 calls `LogBox.ignoreAllLogs()` unconditionally. This suppresses ALL React Native warnings and errors in the app UI including unhandled promise rejections and component errors that would normally surface as red-screen or yellow-box warnings during manual testing. Remove this or gate it behind `__DEV__`.

---

## If Tests Were Added: Recommended Stack

Based on the project's Expo/React Native setup, the standard test stack would be:

```bash
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native
```

**`jest.config.js` starting point:**

```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
```

**Priority test targets (in order):**

1. `src/utils/speechCache.ts` — pure file I/O logic, testable with mocked `expo-file-system`
2. Auth flow state transitions in `src/app/index.tsx` — extract into a pure reducer function first
3. `src/components/avatar/avatarBridge.js` — pure string/object transformation functions
4. Redux slice reducers in `src/redux/slices/` — pure functions, highest ROI for test effort
5. `normalizeAvatarMessage()` — pure string transformation, trivial to test

---

## Manual Testing Coverage

No documented manual test plan exists. Testing appears to be ad-hoc:
- Build and run on Android device/emulator
- Interact with the chat UI manually
- Observe `console.log` output in Metro bundler terminal
- No written test cases, no regression checklist

---

*Testing analysis: 2026-06-15*
