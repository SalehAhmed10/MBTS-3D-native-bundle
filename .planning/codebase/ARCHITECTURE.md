# Architecture

**Analysis Date:** 2026-06-15
**Focus:** Android/iOS production scalability

## Pattern Overview

**Overall:** Flat single-screen app with a WebView-embedded 3D avatar runtime

**Key Characteristics:**
- Single active screen (`src/app/index.tsx`) owns almost all product logic
- 3D rendering happens inside a WebView (`react-native-webview`) running a bundled Three.js page, not native GL
- Communication between React Native and the avatar page uses a bidirectional postMessage bridge
- Redux is present but the main screen uses only local React state; Redux serves the legacy secondary codebase
- Backend calls are raw `fetch()` calls with no abstraction layer (no API client, no error retry, no token refresh)

---

## Layers

**Expo Router shell:**
- Purpose: App entry point, theme provider, Heroku dyno warm-up ping
- Location: `src/app/_layout.tsx`
- Contains: `ThemeProvider`, `AnimatedSplashOverlay`, `Slot` (child route outlet)
- Depends on: `expo-router`, `src/config.js`
- Used by: Metro bundler entry (`expo-router/entry`)

**Main screen (monolithic):**
- Purpose: All primary product logic — chat state machine, speech queue, avatar control, auth flow
- Location: `src/app/index.tsx` (~1,335 lines)
- Contains: chat step state machine (`name → intent → auth`), speech queue, TTS fetch, speech cache reads/writes, avatar event handler, background/emotion selectors, user verification flow
- Depends on: `AvatarWebView`, `speechCache`, `config.js`, `api.js`, raw `fetch()`
- Used by: Expo Router

**Avatar WebView component:**
- Purpose: Wraps `react-native-webview`, owns the avatar page load lifecycle, queues messages until ready, exposes imperative `ref` API
- Location: `src/components/avatar/AvatarWebView.js`
- Depends on: `avatarBridge.js`, `speechProvider.js`, `react-native-webview`
- Exposes: `ref.speak()`, `ref.speakAudio()`, `ref.showText()`, `ref.setAvatar()`, `ref.setMood()`, `ref.setBackground()`

**Avatar bridge utilities:**
- Purpose: URL construction, message serialization, avatar name normalization, injection script builder
- Location: `src/components/avatar/avatarBridge.js`
- Key exports: `bundledAvatarWebViewUrl()`, `buildAvatarWebViewUrl()`, `buildAvatarInjection()`, `buildAvatarBridgeMessage()`

**Speech provider:**
- Purpose: Resolves which speech mode to use and the speech synthesis endpoint URL
- Location: `src/components/avatar/speechProvider.js`
- Current mode: always `service` (hits Heroku backend), never `local-webview`

**Speech cache:**
- Purpose: Filesystem-level TTS response cache keyed by (text, avatarId, voiceId); avoids redundant backend calls
- Location: `src/utils/speechCache.ts`
- Storage: `expo-file-system` `Paths.cache` directory, JSON files with djb2 hash keys
- Cache prefix: `tts-v1`

**Avatar embed (WebView page source):**
- Purpose: Self-contained Three.js + TalkingHead page that renders the 3D avatar and handles audio + lipsync
- Location: `avatar-embed/` (source), `avatar-embed/src/main.js` (entry), `avatar-embed/app.js` (bundled output, 1.8 MB)
- Runtime: browser (WebView), bundled with esbuild targeting `chrome109 / safari16`
- Key module: `avatar-embed/modules/talkinghead.mjs` (Three.js lipsync runtime)
- GLB models: `avatar-embed/avatars/prithi.glb` (~8.6 MB), `avatar-embed/avatars/Camilia.glb` (~2.7 MB)

**Configuration:**
- Purpose: Single source of truth for all API URLs and feature flags
- Location: `src/config.js`
- Reads: `EXPO_PUBLIC_MBTS_API_URL`, `EXPO_PUBLIC_AVATAR_SPEECH_API_URL`, `EXPO_PUBLIC_AVATAR_WEB_VIEW_URL`

**Redux store (secondary / legacy):**
- Purpose: Persisted state for the legacy MBTS screens (person, posts, xShare)
- Location: `src/redux/store/store.js`, `src/redux/reducers/rootReducer.js`
- Persistence: MMKV via `react-native-mmkv-storage`
- Slices: `personSlice`, `postSlice`, `xShareSlice`
- Note: NOT used by the main `index.tsx` screen — only wired in `legacy-mbts-app.js`

---

## 3D / Three.js Rendering Approach

**Approach: WebView-hosted Three.js (not native OpenGL)**

The 3D avatar does NOT render directly in React Native's native GL context. Instead:

1. A `react-native-webview` WebView loads a self-contained HTML page (`avatar-embed/index.html`)
2. That page runs `three` (r184) + `TalkingHead` library inside the WebView's Chromium engine (Android) or WKWebView (iOS)
3. The WebView canvas renders the GLB model with morph-target-based lipsync and plays audio via AudioContext
4. React Native communicates via `injectJavaScript()` (RN → WebView) and `window.ReactNativeWebView.postMessage()` (WebView → RN)

**Why this matters for production:**
- No JSI bridge for 3D — the WebView JS engine is isolated from the RN JS thread; no shared memory
- Avatar load time is dominated by WebView boot + GLB fetch, not JS bundle parse
- `react-native-filament` is installed and `filament-preview.tsx` + `native-avatar-speech.tsx` exist as dead-code spike artifacts; they are blocked from Metro bundling via `config.resolver.blockList` in `metro.config.js`

---

## Avatar / Video Rendering Pipeline

```
User types message
       |
       v
HomeScreen.sendMessage()
  -> fetch(baseURL + 'intents/intentHandler')   [or requestHandler if authenticated]
  -> MBTS API returns { message, type, data }
       |
       v
addAvatarMessage(text)
  -> appends to messages[] (display)
  -> appends to speechQueue[] (TTS dispatch)
       |
       v
useEffect watches speechQueue[0] (activeSpeech)
  -> getCachedSpeech(text, avatarId, voiceId)   [expo-file-system cache lookup]
       |
       +-- cache hit: use cached payload
       |
       +-- cache miss:
             fetch(SPEECH_SYNTHESIS_ENDPOINT)   [Heroku TTS backend]
             cacheSpeech(...)                   [writes JSON to Paths.cache]
       |
       v
avatarWebViewRef.current.speakAudio({
  audioBase64, words, wordTimes, wordDurations,
  visemes, visemeTimes, visemeDurations
})
  -> AvatarWebView.injectJavaScript(buildAvatarInjection(payload))
       |
       v
window.handleReactNativeMessage(payload)   [inside WebView]
  -> TalkingHead.speakAudio()              [Three.js morph-target animation + AudioContext]
       |
       v
window.ReactNativeWebView.postMessage({ type: 'speech_finished' })
  -> AvatarWebView.onMessage handler
  -> handleAvatarEvent -> advanceSpeechQueue()
  -> processes speechQueue[1] (now [0])
```

**Prefetch optimization:** While `speechQueue[0]` is playing, `speechQueue[1]` text is prefetched from the TTS backend and cached, so the next message starts with zero TTS latency (lines 741–782 of `src/app/index.tsx`).

---

## Android Offline Asset Bundling

Android WebView cannot use `fetch()` against `file://` URIs by default. The project resolves this with a four-stage asset pipeline:

**Stage 1 — Build avatar embed:**
```
npm run build:avatar-embed
  runs: scripts/build-avatar-embed.mjs
  esbuild bundles:
    avatar-embed/src/main.js  ->  avatar-embed/app.js  (1.8 MB, ESM, chrome109/safari16)
  copies:
    avatar-embed/app.js           -> android-local-assets/avatar-web/app.js
    avatar-embed/index.html       -> android-local-assets/avatar-web/index.html
    avatar-embed/playback-worklet.js -> android-local-assets/avatar-web/playback-worklet.js
    avatar-embed/avatars/*.glb    -> android-local-assets/avatar-web/avatars/
    avatar-embed/backgrounds/*.jpg -> android-local-assets/avatar-web/backgrounds/
```

**Stage 2 — Gradle asset injection:**
```
android/app/build.gradle:
  sourceSets { main { assets.srcDirs += ["${projectRoot}/android-local-assets"] } }

Gradle merges android-local-assets/ into the APK assets/ directory at build time.
Result: file:///android_asset/avatar-web/index.html exists in the APK.
```

**Stage 3 — Runtime URL selection:**
```
avatarBridge.bundledAvatarWebViewUrl('android')
  returns: 'file:///android_asset/avatar-web/index.html'

iOS / Web:
  returns: defaultAvatarWebViewUrl()
  which is: AVATAR_WEB_VIEW_URL  (https://mbts-3-d-native-bundle.vercel.app/)
```

**Stage 4 — file:// fetch polyfill:**
`avatar-embed/index.html` includes an inline script that replaces `window.fetch` with an XHR-backed implementation for `file://` URLs. This is required because Android WebView blocks `fetch()` on `file://` origins even when `allowFileAccessFromFileURLs` is enabled on the WebView.

**iOS gap:** iOS does not yet have a bundled path. Every iOS session requires a network round-trip to Vercel to load the avatar page. GLB models are also fetched from Vercel CDN on every cold start.

---

## Navigation Architecture

**Router:** Expo Router (file-based, `expo-router ~56.2.7`)

**Active route structure:**
```
src/app/
  _layout.tsx   — root layout: ThemeProvider, AnimatedSplashOverlay, Slot
  index.tsx     — only active route (renders the entire product)
```

**Legacy screens (not reachable via Expo Router):**
- `src/screens/Home.js` — old MBTS chat screen (accessed via `legacy-mbts-app.js` stub)
- `src/screens/AvatarSelection.js`, `ActiveNeeds.js`, `Bidders.js`, `MyNeeds.js`, etc.
- These screens use React Navigation props (`navigation.navigate`, `navigation.goBack`) which are stubbed out in `legacy-mbts-app.js` with no-op implementations

`@react-navigation/drawer`, `@react-navigation/native`, `@react-navigation/native-stack` are all installed but not wired to any active navigation tree.

---

## State Management Flow

**Main screen (`src/app/index.tsx`) — local React state only:**

| State | Type | Purpose |
|---|---|---|
| `messages` | `ChatMessage[]` | Chat history for display |
| `speechQueue` | `SpeechQueueItem[]` | Ordered TTS dispatch; item[0] is active |
| `chatStep` | `"name" \| "intent" \| "auth"` | Conversation state machine |
| `authenticated` | `boolean` | Whether user passed KBA challenge |
| `person` | `CandidateUser \| null` | Verified user record |
| `users` | `CandidateUser[]` | Candidates during auth flow |
| `selectedAvatarId` | `string` | Active avatar selection |
| `selectedVoiceId` | `string \| null` | Active voice selection |
| `selectedEmotionId` | emotion union | Active mood/emotion |
| `selectedBackgroundId` | background union | Active background |
| `avatarOptions` | `AvatarOption[]` | Hydrated from avatar_ready event |

**Redux store (legacy screens only, not used by `index.tsx`):**
- `PostData` — post feed data (postSlice)
- `person` — user profile (personSlice)
- `xShare` — xShare feature data (xShareSlice)
- Persisted to MMKV; rehydrated via `redux-persist` + `PersistGate`

---

## Backend Communication Pattern

**Protocol:** Plain REST over HTTPS, raw `fetch()`, no client wrapper, no retry logic

**All endpoints (called from `index.tsx` and `_layout.tsx`):**

| Purpose | Method | Path |
|---|---|---|
| Dyno warm-up | GET | `{AVATAR_SPEECH_API_URL}avatarSpeech/health` |
| Intent routing | POST | `{MBTS_API_URL}intents/intentHandler` |
| Request handling | POST | `{MBTS_API_URL}requests/requestHandler` |
| User lookup | POST | `{MBTS_API_URL}users/getPersonById` |
| TTS synthesis | POST | `{AVATAR_SPEECH_API_URL}avatarSpeech/synthesize` |

**No WebSocket.** All communication is synchronous request-response. Avatar speech is fetched, cached, then injected into WebView as base64.

**Request body shape for intent handler:**
```json
{ "srx": { "firstName": "...", "speechInput": "..." } }
```

**Request body shape for request handler:**
```json
{ "srx": { "_id": "...", "email": "...", "intent": "...", "packages": [], "isAiMessage": false } }
```

**Error handling pattern (at every call site):**
```javascript
try {
  const response = await fetch(...);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.message || `failed with ${response.status}`);
  // use json
} catch (error) {
  addAvatarMessage(error.message || "I could not reach BOTCierge right now.");
} finally {
  setIsReplying(false);
}
```
No retry, no exponential backoff, no request deduplication, no offline queue.

---

## Metro Bundler Configuration

`metro.config.js` makes exactly two changes to the Expo default:

1. **Enable GLB assets:** `config.resolver.assetExts.push("glb")` — lets Metro treat `.glb` files as static assets (used by the spike Filament path only)
2. **Block Filament models:** `config.resolver.blockList` excludes `assets/models/**` — prevents the 32 MB Filament GLBs from being bundled (the active path does not use Metro-resolved GLBs)

The active production avatar GLBs are NOT resolved by Metro. They travel via:
- Android: Gradle asset pipeline → APK assets → `file:///android_asset/avatar-web/avatars/`
- iOS / Web: Vercel CDN → `https://mbts-3-d-native-bundle.vercel.app/avatars/`

---

## Worker Threads / Background Processing

**AudioWorklet:** `avatar-embed/playback-worklet.js` (~8.4 KB) runs in an `AudioWorklet` context inside the WebView for low-latency audio scheduling. Entirely isolated to the WebView's audio thread — invisible to React Native.

**No React Native background processing.** `react-native-worklets` and `react-native-worklets-core` are installed but not used in the active codebase. `react-native-reanimated` is installed but not used in the active screens.

**TTS prefetch** runs as a best-effort async `fetch()` on the main RN JS thread. No queue management, no cancellation beyond an `isCancelled` flag.

---

## Cross-Cutting Concerns

**Logging:**
- `console.log` with manual namespace prefixes: `[AvatarWebView]`, `[AVT]`, `[speechCache]`, `[HomeScreen][AvatarWebView]`
- No structured logger or log levels
- `LogBox.ignoreAllLogs()` is called in `_layout.tsx` — all RN warnings are suppressed globally, including in production builds

**Validation:**
- Inline regex and length checks in `sendMessage()` (name field: `/^[A-Za-z0-9' ]+\??$/`, auth responses: length limits per property)
- No schema validation library

**Authentication:**
- Knowledge-based challenge-response (favorite color, home country, home state, mother's maiden name)
- No JWT, no session token, no secure storage of credentials
- Auth state (`authenticated`, `person`) is ephemeral React state — lost on app restart

**Platform branching:**
- `Platform.OS === 'android'` in `AvatarWebView.js` and `avatarBridge.js` to select bundled vs. hosted avatar URL
- iOS always hits Vercel network

---

## Production Scalability Flags

These architectural properties directly affect Android/iOS production readiness:

1. **Monolithic screen:** `src/app/index.tsx` is 1,335 lines. Adding features means growing this file unless screens are extracted.

2. **No API client layer:** Every new backend call requires copy-pasting the `fetch()` + `try/catch` + error-message pattern. No centralized timeout, auth header, or error handling.

3. **iOS has no offline avatar:** iOS fetches the 1.8 MB avatar page + 11 MB of GLBs from Vercel on every cold start. If Vercel is down, iOS shows no avatar.

4. **TTS audio as base64 in memory:** The full audio payload (audioBase64 + word timings + visemes) is held in JS memory until injected into the WebView. For longer texts this is multiple MB in the JS heap.

5. **Speech cache has no eviction:** `speechCache.ts` writes indefinitely to `Paths.cache`. Cache entries are never pruned. On long-lived installs this directory will grow unboundedly.

6. **No session persistence:** `authenticated` and `person` are not persisted. Users must re-authenticate on every app launch.

7. **Dead code in production bundle:** `legacy-mbts-app.js`, 7 legacy screens, and all their `.js` component files (ActivityLedgerModal, CategoryListModal, etc.) are imported transitively and included in the bundle. Their dependencies (`@rneui`, `react-native-numeric-input`, etc.) inflate the bundle.

8. **Release build still uses debug keystore:** `android/app/build.gradle` release `signingConfig` points to `signingConfigs.debug`. Must be changed before publishing to Play Store.

---

*Architecture analysis: 2026-06-15*
