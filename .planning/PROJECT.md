# BOTCIERGE Mobile — Project Context

**Type:** Brownfield (React Native port of existing web app)
**Platform:** Android (shipping) + iOS (planned)
**Web counterpart:** chatcamille.ai / MYBOTSTV (C:\Dev-work\websites\sameer\MYBOTSTV)
**Initialized:** 2026-06-15

---

## What This Is

BOTCIERGE Mobile is a React Native + Expo app that brings the BOTCIERGE AI concierge experience to Android and iOS. Users interact with a 3D talking avatar (powered by Three.js/TalkingHead rendered in a WebView) that responds to text input, detects intents, and performs tasks like shopping assistance, scheduling, auth flows, and general Q&A.

The core differentiator: a photorealistic 3D avatar with lip-synced speech. Avatar assets (WebView bundle + GLBs) download once from a CDN on first launch and cache to local device storage — every launch after that is fully offline, no WebView cold-load, near-instant avatar response.

The web version (MYBOTSTV) is the reference implementation. The mobile app must achieve visual and behavioral parity with it.

---

## Core Value

**The avatar must feel alive** — fast, smooth, lip-synced. Users tolerate a chatbot; they trust a person. Latency kills this. First launch pays a one-time download cost; every launch after is instant and offline.

---

## Users

B2C — general consumers who interact with Camille (the default AI concierge) and optionally switch to other avatar personalities (Prithi, Benjamin, John, Margie).

---

## Existing Capabilities (Validated)

From codebase map + web version reference:

- ✓ WebView + Three.js avatar rendering (TalkingHead library)
- ✓ Cross-platform CDN bundle download + local cache (`src/services/avatarBundleManager.js`) — same code path on Android and iOS, no native asset bundling. Core bundle (~5MB: HTML/JS/manifest/backgrounds) downloads on first launch; each avatar's GLB downloads lazily on first selection with a progress UI; everything is cached to `FileSystem.documentDirectory` and served offline after that.
- ✓ 4 avatars working: Camille, Prithi, Benjamin, John (Margie pending asset delivery)
- ✓ TTS via Heroku backend (avatarSpeech/synthesize endpoint)
- ✓ Chat message flow + intent detection via backend
- ✓ User auth (login, identity verification)
- ✓ 5 background images bundled (bg1-bg5.jpg)
- ✓ Redux state management (legacy JS)
- ✓ Expo SDK + TypeScript (new screen layer in src/app/)
- ✓ Speech queue + audio playback pipeline

---

## Active Requirements (v1 Mobile — Next Milestone)

### Avatar Expansion
- [~] **AV-01**: 5 avatars available on mobile: Camille, Prithi, Benjamin, John, Margie — 4/5 implemented (CDN download + cache, not bundled GLBs); Margie pending asset delivery; unverified on device
- [~] **AV-02**: Avatar selection UI in app (user can switch avatar) — implemented, unverified on device
- [~] **AV-03**: Each avatar has correct camera settings (cameraY, cameraFOV, etc.) matching web version — implemented via avatar-embed/avatars/manifest.json, unverified on device
- [~] **AV-04**: Each avatar has assigned TTS voice config — implemented, unverified on device

### Background Selection
- [~] **BG-01**: Rich background gallery exposed in UI (cities, scenes — matching web version) — implemented, 14 options, unverified on device
- [~] **BG-02**: User can select background from gallery before or during session — implemented, unverified on device
- [ ] **BG-03**: Selected background persists to user profile (backend sync) — MMKV local persistence exists; backend sync not confirmed
- [x] **BG-04**: Backgrounds downloaded as part of the CDN core bundle and served from local cache (no bundling into APK, no per-request CDN dependency after first launch)

### Performance & Smoothness
- [ ] **PERF-01**: Avatar loads in <2s on mid-range Android (Pixel 4a class)
- [ ] **PERF-02**: WebView pre-warmed on app start (not on first avatar view)
- [ ] **PERF-03**: TTS response latency < 1.5s from send to avatar speech start
- [ ] **PERF-04**: No dropped frames during avatar speech (60fps target)

### APK Size & Cleanup
- [x] **APK-01**: Filament GLBs removed from assets/models/ (dir no longer exists)
- [x] **APK-02**: filament-preview.tsx and native-avatar-speech.tsx removed; react-native-filament + react-native-worklets-core removed from package.json (2026-07-04)
- [x] **APK-03**: Resolved — all avatars lazy-download their GLB via avatarBundleManager.js with a cache + progress UI; no bundle-vs-remote tradeoff remains
- [~] **APK-04**: Reframed — avatar assets no longer ship in the APK at all (CDN download), so this is now about app code + native deps size, not avatar asset budget. Needs a fresh measurement.

### Production Hardening
- [ ] **PROD-01**: Remove LogBox.ignoreAllLogs() from _layout.tsx
- [ ] **PROD-02**: Replace staging Heroku URL fallback with env-var-only config (throw if missing in prod)
- [ ] **PROD-03**: Fix allowUniversalAccessFromFileURLs — disable on non-local URLs
- [ ] **PROD-04**: Add error boundary around avatar view (crash → graceful fallback, not white screen)
- [ ] **PROD-05**: Add Sentry or equivalent crash/error tracking

### iOS Foundation
- [ ] **IOS-01**: Generate ios/ directory (expo prebuild --platform ios)
- [~] **IOS-02**: Reframed — avatarBundleManager.js already uses a platform-agnostic download+cache path (`FileSystem.documentDirectory`), so this is likely satisfied by existing code once ios/ exists; needs simulator confirmation, not new implementation
- [ ] **IOS-03**: Add iOS privacy manifest (required for App Store submission)
- [ ] **IOS-04**: Test all 5 avatars on iOS simulator

---

## Out of Scope (this milestone)

- EAS Build / App Store submission — no sign-off yet from client
- EAS OTA updates — Expo Updates config pending
- CI/CD pipeline — build is manual for now
- Backend replacement (Heroku staging stays as-is, prod URL TBD by client)
- Native TTS / Filament renderer — abandoned experiment, removing entirely
- Voice input (enableVoiceInput: false, stays off)
- Margie avatar — margie.glb not confirmed available yet; implement when asset delivered

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| WebView + Three.js renderer | Shares codebase with web version, easier 3D dev, proven at chatcamille.ai | Committed |
| ~~Android local asset bundling~~ → CDN download + local cache | Superseded 2026-06-16 (`7f890f4`): cross-platform parity (same code path Android/iOS) without APK bloat; solves the Benjamin GLB size problem for all avatars at once, not just one | Committed — supersedes the original bundling decision |
| Filament renderer removal | 32MB dead weight, WebView is production path | Done (2026-07-04) — GLBs, dead components, and package.json deps all removed |
| Camille as default avatar | Brand identity, client request | Done (2026-06-15) |
| No EAS yet | Client hasn't signed off on store submission | Deferred |
| Benjamin GLB size (31MB) | Resolved via CDN download + cache (avatarBundleManager.js) — no longer bundle vs remote, always lazy-download+cache | Done (2026-06-16) |

---

## Technical Context

- **Stack:** Expo SDK 56, RN 0.85, React 19, TypeScript, WebView (react-native-webview), Three.js/TalkingHead in avatar-embed/, Zustand + React Query (new state layer, Redux retained only for untouched legacy screens)
- **Avatar pipeline:** React Native → WebView (postMessage bridge) → Three.js TalkingHead → lip-sync audio
- **Backend:** Heroku (shared with web version): auth, intents, TTS synthesis, user profiles
- **Asset delivery:** `avatar-embed/` is the Vercel deployment root (`https://mbts-3-d-native-bundle.vercel.app/`). `src/services/avatarBundleManager.js` downloads the core bundle + backgrounds on first launch and each avatar GLB lazily on first selection, caching everything to `FileSystem.documentDirectory`. Same code path on Android and iOS — no native asset bundling step.
- **Build:** `scripts/build-avatar-embed.mjs` rebuilds the WebView bundle when avatar-embed/ changes; deploy to Vercel to publish an update; bump `BUNDLE_VERSION` in avatarBundleManager.js to force clients to re-download

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements validated? → Move to Validated with phase reference
2. New requirements emerged? → Add to Active
3. Decisions to log? → Add to Key Decisions

---

*Last updated: 2026-07-04 after discovering and reconciling the CDN-download architecture pivot (commit 7f890f4) that superseded the original Android local-bundling plan*
