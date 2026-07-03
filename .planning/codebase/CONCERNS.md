# Codebase Concerns

**Analysis Date:** 2026-07-03

## Tech Debt

**Massive Component Files:**
- Issue: `src/screens/Home.js` is 3,283 lines (extremely difficult to maintain)
- Files: `src/screens/Home.js`, `src/app/index.tsx` (1,016 lines), `src/components/xshare/PostNeedForm.js` (729 lines)
- Impact: Makes testing, debugging, and modifying features extremely difficult. Changes in one area may have unintended consequences elsewhere
- Fix approach: Break components into smaller, single-responsibility modules. Start with Home.js which should be split into 8-10 focused screens/components

**Incomplete Redux Migration:**
- Issue: Architecture refactor moved active code from Redux to Zustand, but Redux store still configured and legacy screens still depend on it
- Files: `src/redux/store/store.js`, `src/redux/slices/xShareSlice.js`, `src/screens/Home.js`, `src/screens/ActiveNeeds.js`, `src/screens/AgreementScreen.js`
- Impact: Duplicated state management patterns. Store memory increases, developers must maintain two systems
- Fix approach: Phase 2: Migrate all remaining screens (Home, ActiveNeeds, etc.) from Redux to Zustand to enable Redux removal

**Silent Error Handling Pattern:**
- Issue: `.catch(() => ({}))` used throughout codebase to swallow errors silently, making failures invisible
- Files: `src/hooks/useSendMessage.ts` (line 53), `src/hooks/useSpeech.ts` (line 57, 123), `src/services/avatarBundleManager.js` (line 128), `src/app/_layout.tsx` (line 16)
- Impact: Bugs are undetectable. Failed API calls, JSON parsing errors, and network failures leave no trace. Users experience silent failures
- Fix approach: Replace with proper error logging and user-facing error states. Implement error boundary and toast notifications

**All Logs Suppressed:**
- Issue: `LogBox.ignoreAllLogs()` in `src/app/_layout.tsx` hides all console warnings and errors in development and production
- Files: `src/app/_layout.tsx` (line 13)
- Impact: Legitimate warnings (deprecated APIs, performance issues, memory leaks) are invisible. Impossible to detect problems early
- Fix approach: Remove line 13 entirely. Use ESLint rules to manage warning spam instead (e.g., disable specific rule + disable comment)

## Known Bugs

**Avatar GLB Cache Corruption Detection:**
- Symptoms: App loads corrupted avatars or blank screens when GLB fails to download completely
- Files: `src/services/avatarBundleManager.js` (lines 73-84, 97-101)
- Trigger: Network interruption during GLB download, or storage quota exceeded
- Current mitigation: Check if downloaded file size < 50,000 bytes and delete if so
- Problem: File size threshold is fragile. A valid compressed GLB could be < 50KB. No integrity check (hash/signature)
- Permanent fix: Implement file hash validation (SHA256) or use CDN with If-Range HTTP resume headers

**Race Condition in Avatar Preloading:**
- Symptoms: Multiple simultaneous downloadAvatarGlb calls may create concurrent writes to same file
- Files: `src/services/avatarBundleManager.js` (lines 124-130), `src/components/avatar/AvatarWebView.js`
- Trigger: `preloadAllGlbs()` called multiple times before first batch completes, or user rapidly switches avatars
- Current mitigation: None (fixed recently per commit history but unfixed)
- Fix approach: Add async lock (Semaphore) to downloadAvatarGlb, or use atomic file operations with temporary files

**WebView Bootstrap CSS Injection Fragility:**
- Symptoms: Avatar rendering breaks silently if WebView HTML structure changes, or CSS selectors fail
- Files: `src/components/avatar/AvatarWebView.js` (lines 34-120)
- Trigger: Avatar web bundle updated without notification to mobile app
- Current issue: Hard-coded DOM selectors (#person, #characterName, #background, #avatar) fail if upstream HTML changes
- Fix approach: Implement feature detection instead of version locking. Query DOM for capabilities before injecting

## Security Considerations

**Hardcoded API Endpoints (No Environment Separation):**
- Risk: Production URLs hardcoded in source. No staging/development mode for testing
- Files: `src/config.js` (lines 13-20, 33-34), `src/hooks/useSendMessage.ts` (line 6)
- Current mitigation: Environment variables with hardcoded fallbacks
- Problem: Fallbacks are used if env var missing (always production URLs)
- Recommendations: 
  - Remove hardcoded fallbacks. Fail fast if env vars missing
  - Use `.env.production` and `.env.development` files (git-ignored)
  - Validate all URLs via script before build

**Multiple Chat API Endpoints:**
- Risk: API endpoint fragmentation. `useSendMessage.ts` uses `https://www.chatcamille.ai/api/chat` but `useGetPerson.ts` uses config-based URL
- Files: `src/hooks/useSendMessage.ts` (line 6), `src/hooks/useGetPerson.ts` (line 8), `src/utils/api.js`
- Impact: Different backends may go down independently. No circuit breaker or failover
- Recommendations: Consolidate all API endpoints into `src/config.js`. Use single base URL pattern

**No API Authentication Visible:**
- Risk: POST endpoints have no auth headers (no bearer token, API key, or request signature)
- Files: `src/hooks/useSendMessage.ts`, `src/hooks/useGetPerson.ts`, `src/hooks/useSpeech.ts`
- Impact: Endpoints are publicly accessible if URL is leaked. No request validation on server
- Recommendations: Add auth token to all API calls. Implement request signing for sensitive operations

**Encrypted Storage Without Key Management:**
- Risk: MMKV encryption initialized with default key (no custom passphrase)
- Files: `src/utils/mmkv.js`
- Impact: Encryption key may be easy to extract from app binary. Chat history "encrypted" but key is hardcoded
- Recommendations: Use OS-level keychain (SecureStore from Expo) for sensitive data. MMKV encryption alone is insufficient

## Performance Bottlenecks

**Avatar GLB Bundle Size (Still Large):**
- Problem: Benjamin/John avatars 5-10MB each after compression. Full app bundle with all 4 avatars = ~20MB
- Files: Avatar binaries (not in src but `src/services/avatarBundleManager.js`)
- Cause: WebP texture compression helps but GLB format has overhead. Draco compression removed due to missing DRACOLoader
- Improvement path: 
  - Re-enable Draco decoder in WebView (implement bundled DRACOLoader if needed)
  - Use mesh quantization for geometry reduction
  - Implement lazy GLB loading only when avatar selected (not preload all)

**Speech Synthesis Latency (No Timeout):**
- Problem: User waits indefinitely if TTS API hangs. No timeout handling
- Files: `src/hooks/useSpeech.ts` (lines 45-55, 111-121)
- Cause: fetch() has no timeout. Heroku dynos can sleep and take 30+ seconds to wake
- Improvement path: 
  - Add AbortController with 5s timeout
  - Implement warm-up call to health endpoint during app init (already done in `_layout.tsx` but no effect)
  - Cache TTS responses more aggressively (currently per-avatar-voice, could be per-emotion-mood combo)

**Large Components Block UI Rendering:**
- Problem: Home.js (3,283 lines) renders synchronously. No React.lazy() or code splitting
- Files: `src/screens/Home.js`
- Cause: Heavy import chain and complex render logic
- Improvement path: Split into lazy-loaded sub-screens. Use Suspense boundaries for avatar selection, shopping lists, etc.

**No Connection Retry or Circuit Breaker:**
- Problem: API calls fail once and user sees error. No automatic retry for transient failures
- Files: All fetch() calls in `src/hooks/`, `src/services/`
- Improvement path: Wrap fetch with exponential backoff retry (max 3 attempts). Implement circuit breaker for repeatedly failing endpoints

## Fragile Areas

**WebView Avatar Rendering:**
- Files: `src/components/avatar/AvatarWebView.js`, `src/components/avatar/avatarSession.js`
- Why fragile: 
  - CSS injection assumes WebView DOM structure (selectors may break)
  - Event bridge relies on imperative ref API (`speakAudio`, `loadPerson`) that may change
  - No handshake to verify WebView is ready before injection
- Safe modification: 
  - Add initialization handshake (WebView sends "ready" message, mobile waits)
  - Query DOM for element existence before manipulating (avoid hard selectors)
  - Version the bridge protocol (include version in injected code, check at runtime)
- Test coverage: Zero. No tests for WebView integration

**Auth State Machine:**
- Files: `src/hooks/useAuthFlow.ts`
- Why fragile:
  - Manual state machine with complex branching logic (lines 66-138)
  - String matching for "yes"/"no" responses (fragile to input variation)
  - No timeout for auth challenge (user can abandon challenge mid-flow)
- Safe modification:
  - Use xstate or similar state machine library
  - Normalize input (trim, lowercase) and use token-based matching instead of string contains
  - Add 5-minute timeout to reset challenge if no response
- Test coverage: Zero

**Chat History Persistence:**
- Files: `src/stores/chatStore.ts`
- Why fragile:
  - Redux-persist configuration removed but Zustand has no persistence yet (store resets on reload)
  - No versioning scheme for schema changes
  - No validation of loaded data (could be corrupted from old Redux format)
- Safe modification:
  - Add Zustand persist middleware for auto-save
  - Implement schema version number in storage
  - Validate loaded state against schema on mount
- Test coverage: Zero

**Avatar Selection & WebView Bootstrap:**
- Files: `src/app/index.tsx`, `src/components/avatar/AvatarWebView.js`
- Why fragile:
  - Avatar options fetched from WebView event, no fallback if event missing
  - Selection dropdown may render before avatarOptions populated (brief blank state)
  - No guard against concurrent avatar loads
- Safe modification:
  - Provide default avatarOptions on init
  - Add loading state during avatar fetch
  - Implement race-condition guard (cancel in-flight load if user selects different avatar)
- Test coverage: Zero

## Scaling Limits

**Heroku Dyno Sleep on Inactivity:**
- Current capacity: Heroku free tier dynos sleep after 30 minutes idle
- Limit: First user after sleep waits 30-60 seconds for TTS/chat response
- Impact: Unacceptable UX (app appears broken)
- Scaling path: 
  - Upgrade to paid Heroku dyno (always-on)
  - Or move backend to always-on platform (AWS Lambda with Provisioned Concurrency, Vercel Functions, etc.)

**Avatar Bundle Download Size (Mobile Networks):**
- Current capacity: 5-10MB per avatar on 4G (15-30 seconds to download)
- Limit: Users on 3G/LTE experience multi-minute downloads. No progress UI
- Scaling path:
  - Implement download progress bar in avatar selection
  - Use resumable downloads (Content-Range headers)
  - Consider CDN with regional caching

**Message History Growth (MMKV Storage):**
- Current capacity: MMKV stores in-memory after initial load (could hit device RAM limits)
- Limit: Long conversations (1000+ messages) may slow down store access
- Scaling path:
  - Implement pagination for old messages (keep only last 100 in memory)
  - Archive messages to compressed SQL database periodically

## Dependencies at Risk

**Redux + Redux-Persist (Unused in Active Path):**
- Risk: Dependency bloat. 50KB+ of Redux code loaded but not used in main chat flow
- Impact: Larger bundle size. Harder to reason about data flow
- Migration plan: 
  - Phase 1 (done): Move active chat to Zustand
  - Phase 2: Migrate remaining legacy screens (Home, xShare, etc.)
  - Phase 3: Remove Redux entirely

**Heroku Hosting (Both API & Avatar Speech Backend):**
- Risk: Heroku can have outages. No backup provider. Both critical services on same platform
- Impact: Any Heroku incident blocks entire app (chat, TTS, avatar loading)
- Migration plan:
  - Evaluate API migration to AWS Lambda/Vercel Functions (easier scaling)
  - Keep avatar CDN on Vercel (already working well)
  - Document fallback endpoints for disaster recovery

**Expo SDK Version 56 (Rapid Release Cycle):**
- Risk: Expo SDK 56 reaches end-of-life in ~6 months. Breaking changes in SDK 57
- Impact: Will need to upgrade or fall behind security patches
- Mitigation: Subscribe to Expo release notes. Plan upgrade budget for SDK 57 (likely 2-3 week effort for react-native-filament, plugins)

## Missing Critical Features

**No Error Boundary:**
- Problem: Single uncaught error crashes entire app. No fallback UI
- Blocks: Users can't recover from unexpected failures without force-closing app
- Implementation: Add ErrorBoundary component in `src/app/_layout.tsx`, wrap <Slot /> with try-catch for async errors

**No Network Status Indicator:**
- Problem: User can't tell if app is offline or API is slow
- Blocks: Users retry same message multiple times not realizing network is down
- Implementation: Add react-native-netinfo to detect connection, show banner when offline

**No API Timeout Configuration:**
- Problem: fetch() calls have no timeout. Users wait indefinitely
- Blocks: Can't set timeout policy per endpoint (chat = 5s, TTS = 10s, etc.)
- Implementation: Create fetchWithTimeout() utility, use AbortController

**No Rate Limiting / Backpressure:**
- Problem: User can spam send buttons, creating duplicate messages or overwhelming API
- Blocks: Rapid-fire messages overload backend
- Implementation: Implement message send debounce/throttle (min 500ms between sends)

## Test Coverage Gaps

**No Unit Tests:**
- Untested: All business logic (useAuthFlow, useSendMessage, useSpeech state machine)
- Files: `src/hooks/useAuthFlow.ts` (166 lines, 0% coverage), `src/hooks/useSendMessage.ts` (63 lines), `src/stores/chatStore.ts`
- Risk: Bugs in auth flow (edge cases in name validation, auth challenge reset) go unnoticed. Regressions on refactor
- Priority: **High** - Auth logic is critical path

**No Integration Tests:**
- Untested: Avatar selection → WebView bootstrap → chat flow → TTS playback
- Risk: Cross-layer bugs (e.g., WebView inits before avatarOptions ready) only caught at runtime
- Priority: **High** - Most bug reports likely from integration failures

**No E2E Tests:**
- Untested: Full user flows (name entry → select avatar → send message → hear response → switch avatar)
- Risk: App works in manual testing but breaks in real usage patterns
- Priority: **Medium** - Can use manual QA short-term, but should automate before scaling

**No Performance Tests:**
- Untested: Avatar load time, TTS latency, message history render performance
- Risk: App feels slow or jank but no quantitative data
- Priority: **Low** - Can measure manually, automate later with React Native Profiler integration

---

*Concerns audit: 2026-07-03*
