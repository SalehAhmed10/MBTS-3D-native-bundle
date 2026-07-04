# BOTCIERGE Mobile — Roadmap

**Project:** BOTCIERGE Mobile (React Native)
**Milestone:** v1 Android + iOS Foundation
**Created:** 2026-06-15
**Phases:** 3
**Requirements:** 21

---

## Phases

- [ ] **Phase 1: Avatar & Background Expansion** — All 5 avatars selectable with background gallery, APK cleaned up and under 100MB
- [ ] **Phase 2: Performance, Polish & Production Hardening** — App feels native-smooth and is prod-ready for client handoff
- [ ] **Phase 3: iOS Foundation** — App compiles and runs on iOS simulator with all avatars and assets bundled

---

## Phase Details

### Phase 1: Avatar & Background Expansion

**Goal:** Users can select any of 5 avatars and any background from a gallery, offline after a one-time CDN download on first launch, with dead Filament code removed.
**Depends on:** None
**Complexity:** L
**Note (2026-07-04):** Original goal assumed Android APK asset bundling. Superseded 2026-06-16 (`7f890f4`) by a cross-platform CDN-download-with-cache architecture (`avatarBundleManager.js`) — implemented but unverified on device. See PROJECT.md Key Decisions.

### Requirements

- **AV-01** — User can choose from 5 avatars: Camille, Prithi, Benjamin, John, Margie
- **AV-02** — Avatar selection UI accessible in-app (before or during session)
- **AV-03** — Each avatar loads with correct camera settings matching web version (cameraY, cameraFOV, cameraRotate*)
- **AV-04** — Each avatar has assigned TTS voice: Camille→af_bella, Prithi→ef_dora, Benjamin→am_fenrir, John→am_fenrir, Margie→af_bella
- **BG-01** — User can browse and select from a gallery of backgrounds (minimum 8 scenes matching web version)
- **BG-02** — Selected background applies immediately in the avatar view
- **BG-03** — Background selection persists to user profile (survives app restart)
- **BG-04** — All backgrounds bundled in android-local-assets (no CDN dependency on Android)
- **APK-01** — Remove assets/models/camilia.glb (23MB) and assets/models/prithi.glb (8.6MB) — Filament dead code
- **APK-02** — Remove src/components/filament-preview.tsx and src/components/native-avatar-speech.tsx
- **APK-03** — Benjamin avatar GLB size decision: bundle or lazy-load (31MB Benji.glb is too large to bundle naively)
- **APK-04** — Final APK size under 100MB (Google Play limit for direct download without streaming delivery)

### Success Criteria

1. A user can open the avatar picker and switch between all 5 avatars — each loads without error and speaks with its correct voice. (4/5 implemented — Margie pending asset; unverified on device)
2. A user can open the background gallery, select any scene, and see it applied immediately without a network request — true after the one-time first-launch bundle download.
3. The selected background is still active after closing and reopening the app.
4. Filament GLBs and dead component files/deps are confirmed removed (done); APK size needs a fresh measurement now that avatar assets aren't bundled at all.

**Plans:** 3 written (01-Filament removal, 02-avatars, 03-backgrounds) — see `.planning/phases/01-avatar-background-expansion/`. Execution partially done outside tracked GSD state; needs verification pass before marking phase complete.

---

### Phase 2: Performance, Polish & Production Hardening

**Goal:** The avatar loads in under 2 seconds, responds within 1.5 seconds, maintains 60fps during speech, and the app has no staging-env leaks, security misconfigurations, or uncaught crash paths.
**Depends on:** Phase 1
**Complexity:** M

### Requirements

- **PERF-01** — Avatar visible and interactive within 2s of app reaching avatar screen (mid-range Android)
- **PERF-02** — WebView pre-loaded on app start so first avatar render is instant
- **PERF-03** — TTS response: user sends message → avatar starts speaking within 1.5s
- **PERF-04** — No visible frame drops during avatar speech animation
- **PROD-01** — Remove LogBox.ignoreAllLogs() from src/app/_layout.tsx
- **PROD-02** — Config must throw an error in prod if EXPO_PUBLIC_MBTS_API_URL env var is not set (no staging fallback)
- **PROD-03** — allowUniversalAccessFromFileURLs set to false when WebView source is not a local file URL
- **PROD-04** — Error boundary wraps the avatar screen — crash shows fallback UI, not white screen
- **PROD-05** — Sentry (or equivalent) integrated for crash and error reporting in production builds

### Success Criteria

1. On a Pixel 4a class device, the avatar is visible and responding to input within 2 seconds of reaching the avatar screen, with no janky frames during speech.
2. Sending a chat message results in the avatar beginning to speak within 1.5 seconds.
3. A production build with no EXPO_PUBLIC_MBTS_API_URL set throws a clear startup error instead of silently using a staging URL.
4. Forcing a crash in the avatar screen shows a graceful fallback UI rather than a white screen, and the crash is captured in Sentry.

**Plans:** TBD

---

### Phase 3: iOS Foundation

**Goal:** The app compiles, launches, and runs all 5 avatars on an iOS simulator with assets served locally — no network dependency for avatar rendering (after first launch).
**Depends on:** Phase 2
**Complexity:** M (likely smaller than originally scoped — the CDN-download architecture is already platform-agnostic; IOS-02 may be mostly satisfied by existing code, see REQUIREMENTS.md)

### Requirements

- **IOS-01** — ios/ directory generated via expo prebuild; app compiles and runs on iOS simulator
- **IOS-02** — Avatar assets bundled for iOS (index.html + GLBs accessible at runtime without network)
- **IOS-03** — iOS privacy manifest file added (NSPrivacyAccessedAPITypes, required since spring 2024)
- **IOS-04** — All 5 avatars verified on iOS simulator (no render/GL errors)

### Success Criteria

1. Running `npx expo run:ios` produces a working simulator build with no compile errors.
2. All 5 avatars load and animate on the iOS simulator without any network requests for GLB or HTML assets.
3. The app includes a valid PrivacyInfo.xcprivacy manifest accepted by Xcode without warnings.

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Avatar & Background Expansion | 1/3 (plan 03 has a completion summary; plans 01-02 executed but untracked) | Partially executed, unverified | — |
| 2. Performance, Polish & Production Hardening | 0/0 | Not started | — |
| 3. iOS Foundation | 0/0 | Not started | — |
