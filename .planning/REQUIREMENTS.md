# BOTCIERGE Mobile — Requirements

**Version:** v1 Mobile Milestone
**Last updated:** 2026-07-04 — reconciled with CDN-download architecture pivot (commit `7f890f4`, 2026-06-16) discovered during Phase 1 discussion
**Status:** Phase 1 partially implemented (unverified on device), Phase 2/3 not started

---

## v1 Requirements

### Avatar Expansion (AV)

- [ ] **AV-01** — User can choose from 5 avatars: Camille, Prithi, Benjamin, John, Margie
- [ ] **AV-02** — Avatar selection UI accessible in-app (before or during session)
- [ ] **AV-03** — Each avatar loads with correct camera settings matching web version (cameraY, cameraFOV, cameraRotate*)
- [ ] **AV-04** — Each avatar has assigned TTS voice: Camille→af_bella, Prithi→ef_dora, Benjamin→am_fenrir, John→am_fenrir, Margie→af_bella

### Background Selection (BG)

- [~] **BG-01** — User can browse and select from a gallery of backgrounds (minimum 8 scenes matching web version) — implemented (14 options), unverified on device
- [~] **BG-02** — Selected background applies immediately in the avatar view — implemented, unverified on device
- [ ] **BG-03** — Background selection persists to user profile (survives app restart) — MMKV local persistence only; backend/profile sync not implemented
- [x] **BG-04** — Backgrounds ship as part of the CDN core bundle (downloaded on first launch, cached locally) instead of Android APK bundling — no CDN dependency after first launch, works identically on iOS

### Performance (PERF)

- [ ] **PERF-01** — Avatar visible and interactive within 2s of app reaching avatar screen (mid-range Android)
- [ ] **PERF-02** — WebView pre-loaded on app start so first avatar render is instant
- [ ] **PERF-03** — TTS response: user sends message → avatar starts speaking within 1.5s
- [ ] **PERF-04** — No visible frame drops during avatar speech animation

### APK Cleanup (APK)

- [x] **APK-01** — assets/models/camilia.glb and assets/models/prithi.glb removed (Filament dead code) — directory no longer exists
- [x] **APK-02** — src/components/filament-preview.tsx, native-avatar-speech.tsx removed; react-native-filament + react-native-worklets-core removed from package.json (2026-07-04)
- [x] **APK-03** — Resolved: all avatar GLBs lazy-download via avatarBundleManager.js with local cache + progress UI — no bundle-vs-lazy-load tradeoff remains, applies uniformly to all 5 avatars
- [~] **APK-04** — Reframed: avatar assets no longer count toward APK size at all (downloaded post-install). Requirement is now "app binary size stays reasonable" — needs a fresh build + measurement, not an asset budget decision

### Production Hardening (PROD)

- [ ] **PROD-01** — Remove LogBox.ignoreAllLogs() from src/app/_layout.tsx
- [ ] **PROD-02** — Config must throw an error in prod if EXPO_PUBLIC_MBTS_API_URL env var is not set (no staging fallback)
- [ ] **PROD-03** — allowUniversalAccessFromFileURLs set to false when WebView source is not a local file URL
- [ ] **PROD-04** — Error boundary wraps the avatar screen — crash shows fallback UI, not white screen
- [ ] **PROD-05** — Sentry (or equivalent) integrated for crash and error reporting in production builds

### iOS Foundation (IOS)

- [ ] **IOS-01** — ios/ directory generated via expo prebuild; app compiles and runs on iOS simulator
- [~] **IOS-02** — Reframed: avatarBundleManager.js already uses a platform-agnostic download+cache path (FileSystem.documentDirectory works the same on iOS) — likely satisfied by existing code once ios/ exists, needs simulator confirmation rather than new implementation
- [ ] **IOS-03** — iOS privacy manifest file added (NSPrivacyAccessedAPITypes, required since spring 2024)
- [ ] **IOS-04** — All 5 avatars verified on iOS simulator (no render/GL errors)

---

## v2 Requirements (Deferred)

- EAS Build configuration and App Store / Play Store submission
- EAS OTA updates (Expo Updates)
- CI/CD pipeline (GitHub Actions)
- Voice input feature (enableVoiceInput flag exists, implementation pending)
- TTS caching (two stub implementations exist in codebase — neither complete)
- Margie avatar (pending GLB delivery)
- Production backend URL (client to provide)
- Android keystore for release signing (debug keystore in use)

---

## Out of Scope

- Native Filament renderer — abandoned in favor of WebView path
- New backend features or API changes — mobile consumes existing backend
- UI redesign — match web version (chatcamille.ai) aesthetics
- Monetization / in-app purchases
- Push notifications

---

## Requirement Traceability

| REQ-ID | Description | Phase | Status |
|--------|-------------|-------|--------|
| AV-01 | 5 avatars selectable: Camille, Prithi, Benjamin, John, Margie | Phase 1: Avatar & Background Expansion | Implemented (4/5), unverified |
| AV-02 | Avatar selection UI accessible in-app | Phase 1: Avatar & Background Expansion | Implemented, unverified |
| AV-03 | Each avatar loads with correct camera settings | Phase 1: Avatar & Background Expansion | Implemented, unverified |
| AV-04 | Each avatar assigned correct TTS voice | Phase 1: Avatar & Background Expansion | Implemented, unverified |
| BG-01 | Background gallery with 8+ scenes | Phase 1: Avatar & Background Expansion | Implemented, unverified |
| BG-02 | Selected background applies immediately | Phase 1: Avatar & Background Expansion | Implemented, unverified |
| BG-03 | Background selection persists to user profile | Phase 1: Avatar & Background Expansion | Partial (local only, no backend sync) |
| BG-04 | Backgrounds delivered via CDN bundle + cache | Phase 1: Avatar & Background Expansion | Done |
| APK-01 | Remove Filament GLBs from assets/models/ | Phase 1: Avatar & Background Expansion | Done |
| APK-02 | Remove dead Filament component files + deps | Phase 1: Avatar & Background Expansion | Done |
| APK-03 | Benjamin GLB bundle-vs-lazy-load decision | Phase 1: Avatar & Background Expansion | Done — resolved via CDN download+cache |
| APK-04 | Final APK under 100MB | Phase 1: Avatar & Background Expansion | Reframed — needs fresh measurement |
| PERF-01 | Avatar loads in <2s on mid-range Android | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PERF-02 | WebView pre-warmed on app start | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PERF-03 | TTS response: message to speech start <1.5s | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PERF-04 | No frame drops during avatar speech | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PROD-01 | Remove LogBox.ignoreAllLogs() | Phase 2: Performance, Polish & Production Hardening | Not done — still present in src/app/_layout.tsx |
| PROD-02 | Prod config throws if API URL env var missing | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PROD-03 | allowUniversalAccessFromFileURLs scoped correctly | Phase 2: Performance, Polish & Production Hardening | Not done — still unconditionally true in AvatarWebView.js |
| PROD-04 | Error boundary on avatar screen | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PROD-05 | Sentry crash reporting integrated | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| IOS-01 | ios/ dir generated; app runs on simulator | Phase 3: iOS Foundation | Unplanned |
| IOS-02 | Avatar assets bundled for iOS (no network) | Phase 3: iOS Foundation | Likely satisfied by existing avatarBundleManager.js — needs simulator confirmation |
| IOS-03 | iOS privacy manifest added | Phase 3: iOS Foundation | Unplanned |
| IOS-04 | All 5 avatars verified on iOS simulator | Phase 3: iOS Foundation | Unplanned |
