# BOTCIERGE Mobile — Requirements

**Version:** v1 Mobile Milestone
**Last updated:** 2026-06-15
**Status:** Ready for roadmap

---

## v1 Requirements

### Avatar Expansion (AV)

- [ ] **AV-01** — User can choose from 5 avatars: Camille, Prithi, Benjamin, John, Margie
- [ ] **AV-02** — Avatar selection UI accessible in-app (before or during session)
- [ ] **AV-03** — Each avatar loads with correct camera settings matching web version (cameraY, cameraFOV, cameraRotate*)
- [ ] **AV-04** — Each avatar has assigned TTS voice: Camille→af_bella, Prithi→ef_dora, Benjamin→am_fenrir, John→am_fenrir, Margie→af_bella

### Background Selection (BG)

- [ ] **BG-01** — User can browse and select from a gallery of backgrounds (minimum 8 scenes matching web version)
- [ ] **BG-02** — Selected background applies immediately in the avatar view
- [ ] **BG-03** — Background selection persists to user profile (survives app restart)
- [ ] **BG-04** — All backgrounds bundled in android-local-assets (no CDN dependency on Android)

### Performance (PERF)

- [ ] **PERF-01** — Avatar visible and interactive within 2s of app reaching avatar screen (mid-range Android)
- [ ] **PERF-02** — WebView pre-loaded on app start so first avatar render is instant
- [ ] **PERF-03** — TTS response: user sends message → avatar starts speaking within 1.5s
- [ ] **PERF-04** — No visible frame drops during avatar speech animation

### APK Cleanup (APK)

- [ ] **APK-01** — Remove assets/models/camilia.glb (23MB) and assets/models/prithi.glb (8.6MB) — Filament dead code
- [ ] **APK-02** — Remove src/components/filament-preview.tsx and src/components/native-avatar-speech.tsx
- [ ] **APK-03** — Benjamin avatar GLB size decision: bundle or lazy-load (31MB Benji.glb is too large to bundle naively)
- [ ] **APK-04** — Final APK size under 100MB (Google Play limit for direct download without streaming delivery)

### Production Hardening (PROD)

- [ ] **PROD-01** — Remove LogBox.ignoreAllLogs() from src/app/_layout.tsx
- [ ] **PROD-02** — Config must throw an error in prod if EXPO_PUBLIC_MBTS_API_URL env var is not set (no staging fallback)
- [ ] **PROD-03** — allowUniversalAccessFromFileURLs set to false when WebView source is not a local file URL
- [ ] **PROD-04** — Error boundary wraps the avatar screen — crash shows fallback UI, not white screen
- [ ] **PROD-05** — Sentry (or equivalent) integrated for crash and error reporting in production builds

### iOS Foundation (IOS)

- [ ] **IOS-01** — ios/ directory generated via expo prebuild; app compiles and runs on iOS simulator
- [ ] **IOS-02** — Avatar assets bundled for iOS (index.html + GLBs accessible at runtime without network)
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
| AV-01 | 5 avatars selectable: Camille, Prithi, Benjamin, John, Margie | Phase 1: Avatar & Background Expansion | Unplanned |
| AV-02 | Avatar selection UI accessible in-app | Phase 1: Avatar & Background Expansion | Unplanned |
| AV-03 | Each avatar loads with correct camera settings | Phase 1: Avatar & Background Expansion | Unplanned |
| AV-04 | Each avatar assigned correct TTS voice | Phase 1: Avatar & Background Expansion | Unplanned |
| BG-01 | Background gallery with 8+ scenes | Phase 1: Avatar & Background Expansion | Unplanned |
| BG-02 | Selected background applies immediately | Phase 1: Avatar & Background Expansion | Unplanned |
| BG-03 | Background selection persists to user profile | Phase 1: Avatar & Background Expansion | Unplanned |
| BG-04 | Backgrounds bundled in android-local-assets | Phase 1: Avatar & Background Expansion | Unplanned |
| APK-01 | Remove Filament GLBs from assets/models/ | Phase 1: Avatar & Background Expansion | Unplanned |
| APK-02 | Remove dead Filament component files | Phase 1: Avatar & Background Expansion | Unplanned |
| APK-03 | Benjamin GLB bundle-vs-lazy-load decision | Phase 1: Avatar & Background Expansion | Unplanned |
| APK-04 | Final APK under 100MB | Phase 1: Avatar & Background Expansion | Unplanned |
| PERF-01 | Avatar loads in <2s on mid-range Android | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PERF-02 | WebView pre-warmed on app start | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PERF-03 | TTS response: message to speech start <1.5s | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PERF-04 | No frame drops during avatar speech | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PROD-01 | Remove LogBox.ignoreAllLogs() | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PROD-02 | Prod config throws if API URL env var missing | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PROD-03 | allowUniversalAccessFromFileURLs scoped correctly | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PROD-04 | Error boundary on avatar screen | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| PROD-05 | Sentry crash reporting integrated | Phase 2: Performance, Polish & Production Hardening | Unplanned |
| IOS-01 | ios/ dir generated; app runs on simulator | Phase 3: iOS Foundation | Unplanned |
| IOS-02 | Avatar assets bundled for iOS (no network) | Phase 3: iOS Foundation | Unplanned |
| IOS-03 | iOS privacy manifest added | Phase 3: iOS Foundation | Unplanned |
| IOS-04 | All 5 avatars verified on iOS simulator | Phase 3: iOS Foundation | Unplanned |
