# Codebase Concerns

**Analysis Date:** 2026-07-03

## Tech Debt

**Redux Dependency Lingering:**
- Issue: Redux, redux-persist, and redux-thunk remain in `package.json` despite active migration to Zustand. Architecture refactor task T8 ("Retire Redux") only decouple active code path, not legacy screens.
- Files: `package.json` (lines 11, 56-57), legacy screens in `src/screens/`, `src/components/legacy-mbts-app.js`
- Impact: Maintains 3 unused npm packages (~300KB), adds maintenance burden, complicates dependency tree. Legacy screens (xShare, ActiveNeeds, AvatarSelection) still tightly coupled to old state management.
- Fix approach: Identify all screens still importing from Redux store. Migrate xShare/ActiveNeeds/AvatarSelection to Zustand. Remove Redux deps from package.json once all screens migrated.

**Large Component Files:**
- Issue: `src/app/index.tsx` is 1016 lines despite architecture refactor reducing from 1410 lines. Still contains dropdown handling, background selection, emotion selection inline.
- Files: `src/app/index.tsx`
- Impact: Difficult to test, hard to maintain, violates single-responsibility principle. Refactor was only 30% reduction.
- Fix approach: Extract avatar selector logic into `useAvatarSelector` hook. Extract emotion/background selection into separate components. Target 300-400 lines.

**AvatarWebView Complexity:**
- Issue: `src/components/avatar/AvatarWebView.js` is 461 lines with imperative bootstrapping logic, CSS injection, and message handling all inline.
- Files: `src/components/avatar/AvatarWebView.js`
- Impact: Difficult to debug WebView sync issues. Tight coupling between RN and Web avatar embed.
- Fix approach: Extract CSS injection into `avatarStyles.js`. Extract bootstrap script generation into `avatarBootstrap.js`. Separate message handling logic.

---

## Missing Critical Features

**Zero Test Coverage:**
- Problem: No tests found in `src/`. No test configuration (jest.config.js, vitest.config.ts, etc.) in project root.
- Files: Entire `src/` directory, `package.json` (missing test runner)
- Blocks: Cannot confidently refactor. Can't verify auth flow state machine behavior. Speech queue orchestration untested. Chat message handling untested.
- Priority: High

---

## Error Handling Gaps

**Silent Failures in Speech Synthesis:**
- Issue: `useSpeech` hook catches errors but only logs to console. If prefetch fails, the error is silently ignored.
  ```typescript
  // Line 127-129 in src/hooks/useSpeech.ts
  catch {
    // best-effort prefetch, ignore errors
  }
  ```
- Files: `src/hooks/useSpeech.ts` (lines 127-129)
- Risk: User sees broken animations/audio. No indication to user or error tracking that TTS synthesis failed.
- Fix approach: Log prefetch errors to user-facing analytics/Sentry. On active speech failure, add fallback message "Audio unavailable, please retry."

**Unguarded API Response Parsing:**
- Issue: `useSendMessage` silently converts JSON parse failures to empty object:
  ```typescript
  // Line 53
  const json = (await response.json().catch(() => ({}))) as ChatApiResponse;
  ```
- Files: `src/hooks/useSendMessage.ts` (line 53)
- Risk: If server returns invalid JSON, app treats it as valid response with empty fields. Messages fail silently.
- Fix approach: Distinguish between "request failed" and "response malformed". Throw distinct error types.

**Prefetch Network Errors Invisible:**
- Issue: `useSpeech` prefetch ignores network errors entirely:
  ```typescript
  // Lines 110-126: network call with silent catch
  try {
    const res = await fetch(SPEECH_SYNTHESIS_ENDPOINT, ...);
    if (!res.ok || cancelled) return;
    // ... cache
  } catch {
    // best-effort prefetch, ignore errors
  }
  ```
- Files: `src/hooks/useSpeech.ts` (lines 110-129)
- Risk: If speech synthesis service is down, user won't know until they try to speak.
- Fix approach: Track prefetch failures. Show "Speech service unavailable" warning in UI after N failures.

**Missing Boundary Checks in Auth Flow:**
- Issue: `useAuthFlow` filters candidate users but doesn't validate filter results at boundaries:
  ```typescript
  // Line 101-103: filters but assumes results exist
  const filteredUsers = users.filter(
    (u) => u.lastName !== firstUser?.lastName || u.homeCity !== firstUser?.homeCity
  );
  ```
- Files: `src/hooks/useAuthFlow.ts` (lines 100-114)
- Risk: If filter returns empty array, code path at line 108 tries to access `filteredUsers[0]` which is undefined.
- Fix approach: Add guard: `if (filteredUsers.length === 0) { addAvatarMessage(AUTH_FAILURE_PROMPT); return; }`

---

## Security Considerations

**Hardcoded API Endpoints with Weak Fallbacks:**
- Risk: If environment variables aren't set, app defaults to staging Heroku endpoints. Production secrets might be exposed via wrong backend.
- Files: `src/config.js` (lines 13-26)
- Current mitigation: Env vars `EXPO_PUBLIC_MBTS_API_URL`, `EXPO_PUBLIC_AVATAR_SPEECH_API_URL`, `EXPO_PUBLIC_AVATAR_WEB_VIEW_URL`
- Recommendations: 
  1. Validate at startup that endpoints are production URLs (check domain). Fail loud if not.
  2. Use bundle-time config, not runtime fallbacks.
  3. Log which endpoint is active on app launch.

**Unvalidated User Input in Auth:**
- Risk: `handleNameMessage` validates with regex but other inputs don't:
  ```typescript
  // Line 141: strict validation for name
  if (!/^[A-Za-z0-9' ]+\??$/.test(nextMessage)) {
    addAvatarMessage('Invalid name');
    return;
  }
  // But auth properties are checked with simple length + substring:
  // Line 126: only length check, no sanitization
  if (nextMessage.length > getLimit(currentAuthProp)) {
  ```
- Files: `src/hooks/useAuthFlow.ts` (lines 126, 140-155)
- Recommendations: Apply consistent sanitization. Escape user input before sending to API. Use schema validation (Zod).

**Toast/Error Messages Leak Implementation Details:**
- Risk: Error messages like "BOTCierge request failed with 500" expose server error codes to user. "JSON parsing failed" leaks tech stack details.
- Files: `src/hooks/useSendMessage.ts` (line 50), `src/hooks/useGetPerson.ts` (line 20)
- Recommendations: Log full error server-side. Show generic message to user: "Service temporarily unavailable. Please try again."

---

## Performance Bottlenecks

**Speech Queue Serialization (No Prefetch Win):**
- Problem: Despite prefetch loop (lines 102-141 in `useSpeech`), if active speech finishes quickly, prefetch request may still be in-flight when user tries to play next item. No cancellation of old prefetch.
- Files: `src/hooks/useSpeech.ts` (lines 102-141)
- Cause: Prefetch uses `let cancelled` but doesn't abort fetch. Old requests continue in background.
- Improvement path: Use `AbortController` to cancel in-flight prefetch when active speech changes.

**WebView Message Passing Blocking:**
- Problem: `avatarWebViewRef.current.speakAudio()` is a synchronous imperative call. If WebView is busy rendering, RN thread blocks.
- Files: `src/hooks/useSpeech.ts` (lines 65-78), `src/app/index.tsx` (lines 369, 337, 333)
- Cause: No async handling, no message queue on WebView side.
- Improvement path: Batch messages. Use `postMessage` from WebView ref instead of imperative method call. Add retry with exponential backoff if WebView not ready.

**No Image Optimization for Backgrounds:**
- Problem: Background images loaded directly as require() - no optimization, caching, or lazy loading.
- Files: `src/app/index.tsx` (lines 110-122)
- Cause: Static require() imports force all 12 background images into bundle.
- Improvement path: Use dynamic imports or lazy-load from CDN. Cache in MMKV after first download.

---

## Fragile Areas

**Speech Queue State Machine:**
- Files: `src/stores/chatStore.ts` (lines 67-68), `src/hooks/useSpeech.ts` (lines 24-28)
- Why fragile: Speech queue state lives in Zustand. Mutations happen from:
  1. `addSpeechItem()` in `index.tsx` when avatar replies
  2. `advanceSpeechQueue()` in `useSpeech` when item finishes
  3. `advanceSpeechQueue()` in index.tsx on error
  
  No guard against double-advance or out-of-order mutations. If `useSpeech` finishes at same time as error handler calls `advanceSpeechQueue()`, items skip.
- Safe modification: Wrap queue operations in transactions. Add invariant checks: `queue.length === (isPlaying ? 1 : 0) + (isPrefetching ? 1 : 0)`.
- Test coverage: Zero tests for speech queue orchestration.

**Auth Flow State Transitions:**
- Files: `src/hooks/useAuthFlow.ts` (lines 46-138), `src/stores/chatStore.ts` (lines 55, 81-89)
- Why fragile: Auth state machine has 3 steps ('name' → 'intent' → 'auth'). Transitions depend on:
  - User input validation (string length, regex)
  - API response shape (assumes `users`, `data`, `type`)
  - Candidate user filtering (multiple users → single user)
  
  No explicit state guards. If API returns `{ data: [] }` when expecting users, filter fails silently.
- Safe modification: 
  1. Add explicit guards at line 70: `if (candidateUsers.length === 0) { throw new Error("No candidates"); }`
  2. Add state machine assertions before every transition.
  3. Add test cases for all transition paths.
- Test coverage: Zero tests for auth flow.

**AvatarWebView Bootstrap Injection:**
- Files: `src/components/avatar/AvatarWebView.js` (lines 34-120+)
- Why fragile: Bootstrap script injects CSS + JS into WebView expecting specific DOM elements ('person', 'background', 'characterName'). If avatar web app restructures its HTML, injection breaks silently.
- Safe modification: 
  1. Add error logging if DOM elements not found.
  2. Add version check for avatar web app (bundle includes version).
  3. Fallback to basic avatar if injection fails.
- Test coverage: No E2E tests verifying bootstrap works.

---

## Scaling Limits

**TTS Cache File Unlimited Growth:**
- Current capacity: No limit on cache directory size. Hash-based filename means old entries never cleaned.
- Limit: On long-running app, cache could grow to 100MB+ after weeks of use.
- Scaling path: 
  1. Implement LRU cache with max size (e.g., 50MB).
  2. Add cache cleanup on app launch (prune files older than 30 days).
  3. Monitor cache directory size, warn user if >75MB.
- Files: `src/utils/speechCache.ts` (lines 49-63)

**Message History Unbounded:**
- Current capacity: `conversationHistory` in `chatStore` grows indefinitely. No pagination or pruning.
- Limit: After 1000+ messages, array operations slow down.
- Scaling path:
  1. Trim history to last 100 messages before sending to API.
  2. Archive old messages to MMKV with date key.
  3. Load archived history on demand.
- Files: `src/stores/chatStore.ts` (lines 21, 70, 37)

**Speech Queue If Stuck:**
- Current capacity: Speech queue is unbounded. If speech synthesis fails, queue never clears.
- Limit: If prefetch fails repeatedly, queue could grow to 50+ items (memory leak).
- Scaling path: Add max queue size limit (10 items). On exceed, clear queue and show "Speech system overloaded, please refresh."
- Files: `src/hooks/useSpeech.ts` (lines 24-28)

---

## Dependencies at Risk

**React Native WebView - Critical Infrastructure Dependency:**
- Risk: WebView is the only rendering path for 3D avatar. If RN WebView has breaking changes or becomes unmaintained, avatar rendering breaks.
- Current: `react-native-webview@^13.16.1` (line 51, package.json)
- Impact: Cannot render avatar at all without this.
- Migration plan: 
  1. Evaluate `@react-native-camera/camera` + Skia + React Three Fiber as alternative 3D rendering paths.
  2. At minimum, add fallback to static avatar image if WebView fails to load.

**Expo File System - Cache Dependency:**
- Risk: Speech cache relies on `expo-file-system`. If Expo stops supporting, cache implementation breaks.
- Current: `expo-file-system@~56.0.7` (line 21, package.json)
- Impact: TTS speech synthesis will fail for all cached speeches.
- Migration plan: Add abstraction layer for cache. Support both Expo file system and async-storage fallback.

**Three.js in DevDependencies Only:**
- Risk: Three.js is imported by avatar web bundle (loaded via WebView) but not in dependencies, only devDependencies.
- Current: `three@^0.184.0` (line 70, devDependencies)
- Impact: Three.js won't be bundled in production. Avatar renderer relies on web CDN.
- Fix: Either move to dependencies with note that it's for build-time avatar bundle generation, or add clear documentation.

**React Native Reanimated Version Lock:**
- Risk: Pinned to `4.3.1`, but many projects have reported compatibility issues upgrading from 3.x → 4.x.
- Current: `react-native-reanimated@4.3.1` (line 46, package.json)
- Impact: Hard to upgrade if critical security fix released in 5.x.
- Recommendation: Review reanimated usage. If only used for keyboard animation, consider simpler solution.

---

## Test Coverage Gaps

**No Unit Tests for State Management:**
- What's not tested: Zustand store mutations (chatStore, avatarStore). All edge cases of state transitions.
  - `addMessage()`, `addSpeechItem()`, `advanceSpeechQueue()` behavior with edge cases (empty queue, rapid adds)
  - Avatar options hydration logic
  - Background persistence via MMKV
- Files: `src/stores/chatStore.ts`, `src/stores/avatarStore.ts`
- Risk: State mutations silently fail. Refactors introduce bugs that are only discovered when user complains.
- Priority: High

**No Tests for API Hooks:**
- What's not tested: `useSendMessage`, `useGetPerson`, `useSpeech` error cases
  - Network failures (timeout, 500 error, bad JSON)
  - Partial responses (missing fields)
  - Concurrent requests (two messages sent rapidly)
- Files: `src/hooks/useSendMessage.ts`, `src/hooks/useGetPerson.ts`, `src/hooks/useSpeech.ts`
- Risk: API integration bugs only caught in manual testing or production.
- Priority: High

**No Tests for Auth Flow State Machine:**
- What's not tested: All 8 state transitions in `useAuthFlow`
  - Confirm/reject user (yes/no handling)
  - Filter users by auth property
  - Verification after all properties answered
  - Edge cases: empty filter results, single user, no candidates
- Files: `src/hooks/useAuthFlow.ts`
- Risk: Auth system is critical path. Silent failures leave users unable to authenticate.
- Priority: Critical

**No UI/E2E Tests:**
- What's not tested: End-to-end flows
  - Name entry → auth → chat → speech
  - Avatar switching mid-conversation
  - WebView bootstrap and avatar loading
  - Background switching
- Files: Entire app
- Risk: Regressions only discovered by manual QA.
- Priority: Medium

---

## Deployment & Configuration Issues

**Environment Variable Fallbacks Not Validated:**
- Issue: `src/config.js` provides hardcoded fallbacks for all API endpoints. App will "work" even if env vars are wrong.
- Files: `src/config.js` (lines 13-34)
- Risk: Accidental production deployment pointing to staging backend (HIPAA/security violation).
- Recommendation: 
  1. Add startup validation: throw if endpoint domain is not production.
  2. Log active endpoints on app launch.
  3. Require explicit prod vs staging marker in config.

**Feature Flags Not Documented:**
- Issue: Feature flags exist (`FEATURES` object, line 40-44 in config.js) but no documentation of when to toggle them.
- Files: `src/config.js` (lines 40-44)
- Current: `enableVoiceInput: false`, `enableOfflineMode: true`, `enableChatHistory: true`
- Risk: Code paths for disabled features still exist but untested.
- Recommendation: Document each flag with conditions for enabling and impact on app behavior.

---

## Known Issues & Workarounds

**LogBox Completely Suppressed:**
- Issue: `_layout.tsx` silences all warnings:
  ```typescript
  // Line 13
  LogBox.ignoreAllLogs();
  ```
- Files: `src/app/_layout.tsx` (line 13)
- Impact: Legitimate warnings (deprecated APIs, performance issues) are hidden. Makes debugging harder.
- Workaround: In development, comment out. In production, only suppress specific warnings.

**Heroku Dyno Warming Health Check:**
- Issue: App manually calls SPEECH_HEALTH_ENDPOINT on launch to warm the dyno:
  ```typescript
  // Line 16
  fetch(SPEECH_HEALTH_ENDPOINT).catch(() => {});
  ```
- Files: `src/app/_layout.tsx` (lines 15-17)
- Workaround: Heroku's dyno sleeping is a performance issue. This is a band-aid.
- Real fix: Upgrade to Heroku Standard tier or migrate to Vercel serverless for speech synthesis API.

---

*Concerns audit: 2026-07-03*
