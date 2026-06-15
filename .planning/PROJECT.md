# BOTCIERGE Mobile — Project Context

**Type:** Brownfield (React Native port of existing web app)
**Platform:** Android (shipping) + iOS (planned)
**Web counterpart:** chatcamille.ai / MYBOTSTV (C:\Dev-work\websites\sameer\MYBOTSTV)
**Initialized:** 2026-06-15

---

## What This Is

BOTCIERGE Mobile is a React Native + Expo app that brings the BOTCIERGE AI concierge experience to Android and iOS. Users interact with a 3D talking avatar (powered by Three.js/TalkingHead rendered in a WebView) that responds to text input, detects intents, and performs tasks like shopping assistance, scheduling, auth flows, and general Q&A.

The core differentiator: a photorealistic 3D avatar with lip-synced speech that runs **offline** on device via locally bundled assets — no CDN latency, no WebView cold-load, near-instant avatar response.

The web version (MYBOTSTV) is the reference implementation. The mobile app must achieve visual and behavioral parity with it.

---

## Core Value

**The avatar must feel alive** — fast, smooth, lip-synced. Users tolerate a chatbot; they trust a person. Latency kills this.

---

## Users

B2C — general consumers who interact with Camille (the default AI concierge) and optionally switch to other avatar personalities (Prithi, Benjamin, John, Margie).

---

## Existing Capabilities (Validated)

From codebase map + web version reference:

- ✓ WebView + Three.js avatar rendering (TalkingHead library)
- ✓ Android offline asset bundling (android-local-assets/ → APK native assets)
- ✓ 2 avatars working on Android: Camille (Camilia.glb 2.7MB), Prithi (prithi.glb 8.6MB)
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
- [ ] **AV-01**: 5 avatars available on mobile: Camille, Prithi, Benjamin, John, Margie (with GLBs bundled)
- [ ] **AV-02**: Avatar selection UI in app (user can switch avatar)
- [ ] **AV-03**: Each avatar has correct camera settings (cameraY, cameraFOV, etc.) matching web version
- [ ] **AV-04**: Each avatar has assigned TTS voice config

### Background Selection
- [ ] **BG-01**: Rich background gallery exposed in UI (cities, scenes — matching web version)
- [ ] **BG-02**: User can select background from gallery before or during session
- [ ] **BG-03**: Selected background persists to user profile (backend sync)
- [ ] **BG-04**: Backgrounds bundled in android-local-assets (no CDN dependency)

### Performance & Smoothness
- [ ] **PERF-01**: Avatar loads in <2s on mid-range Android (Pixel 4a class)
- [ ] **PERF-02**: WebView pre-warmed on app start (not on first avatar view)
- [ ] **PERF-03**: TTS response latency < 1.5s from send to avatar speech start
- [ ] **PERF-04**: No dropped frames during avatar speech (60fps target)

### APK Size & Cleanup
- [ ] **APK-01**: Remove Filament GLBs from assets/models/ (saves ~32MB): camilia.glb (23MB) + prithi.glb (8.6MB)
- [ ] **APK-02**: Remove filament-preview.tsx and native-avatar-speech.tsx (dead code)
- [ ] **APK-03**: Benjamin GLB (Benji.glb 31MB) — evaluate: bundle locally or serve remotely
- [ ] **APK-04**: Total APK size budget: <100MB after all 5 avatars

### Production Hardening
- [ ] **PROD-01**: Remove LogBox.ignoreAllLogs() from _layout.tsx
- [ ] **PROD-02**: Replace staging Heroku URL fallback with env-var-only config (throw if missing in prod)
- [ ] **PROD-03**: Fix allowUniversalAccessFromFileURLs — disable on non-local URLs
- [ ] **PROD-04**: Add error boundary around avatar view (crash → graceful fallback, not white screen)
- [ ] **PROD-05**: Add Sentry or equivalent crash/error tracking

### iOS Foundation
- [ ] **IOS-01**: Generate ios/ directory (expo prebuild --platform ios)
- [ ] **IOS-02**: Bundle avatar assets for iOS (equivalent to android-local-assets/ strategy)
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
| Android local asset bundling | Eliminates WebView cold-load latency, enables true offline | Committed |
| Filament renderer removal | 32MB dead weight, WebView is production path | Pending removal |
| Camille as default avatar | Brand identity, client request | Done (2026-06-15) |
| No EAS yet | Client hasn't signed off on store submission | Deferred |
| Benjamin GLB size (31MB) | Decide: bundle vs remote serve | TBD in Avatar Expansion phase |

---

## Technical Context

- **Stack:** Expo SDK 52, RN 0.76, TypeScript, WebView (react-native-webview), Three.js/TalkingHead in avatar-embed/
- **Avatar pipeline:** React Native → WebView (postMessage bridge) → Three.js TalkingHead → lip-sync audio
- **Backend:** Heroku (shared with web version): auth, intents, TTS synthesis, user profiles
- **Asset bundling:** android-local-assets/ → Gradle sourceSets → `file:///android_asset/avatar-web/`
- **Build:** `scripts/build-avatar-embed.mjs` rebuilds the WebView bundle when avatar-embed/ changes

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements validated? → Move to Validated with phase reference
2. New requirements emerged? → Add to Active
3. Decisions to log? → Add to Key Decisions

---

*Last updated: 2026-06-15 after brownfield initialization*
