# Implementation Plan — 12 June 2026
## MBTS BOTCierge: Production-Ready WebView + Offline Architecture

**Goal:** Ship on Apple App Store + Google Play Store with sub-1s perceived latency, offline-resilient avatar loading, and cached TTS responses.

**Stack decision:** Keep React Native + WebView + Three.js/TalkingHead. Heroku basic dyno (no cold starts). Add local caching layer per the offline architecture PDF.

---

## Priority 1 — Latency fixes (do this week, works on current android build)

### TASK-01: TTS Response Cache
**File:** create `src/utils/speechCache.ts`
**Impact:** Eliminates ~300–800ms per repeated phrase. Biggest UX win.

```
What to build:
- Cache TTS fetch response (audioBase64 + visemes + wordTimes) keyed by hash of text+avatar+voiceId
- Storage: expo-file-system (already installed) → FileSystem.cacheDirectory + 'tts-v1/'
- Cache hit → skip fetch, inject immediately
- Cache miss → fetch, store, inject
- Cache invalidation: none needed (TTS output is deterministic per input)
```

**Wire into:** `src/app/index.tsx` speech dispatch effect (the `useEffect` that watches `activeSpeech`)

**Reference:** `src/components/native-avatar-speech.tsx` already does this — port that pattern.

---

### TASK-02: Heroku Dyno Warmup on App Start
**File:** `src/app/_layout.tsx`
**Impact:** No more 5–15s stall on first TTS request. Already wired in `hasWarmedSpeechBackendRef` in index.tsx but fires too late.

```tsx
// Add to _layout.tsx useEffect on mount — fire and forget
import { SPEECH_HEALTH_ENDPOINT } from '@/config';

useEffect(() => {
  fetch(SPEECH_HEALTH_ENDPOINT).catch(() => {});
}, []);
```

Move warmup from index.tsx to layout so it fires before user even reaches HomeScreen.

---

### TASK-03: WebView Preload (Hidden Mount)
**File:** `src/app/_layout.tsx` or a new `src/components/avatar/AvatarWebViewPreloader.tsx`
**Impact:** By the time user lands on HomeScreen, WebView is already loaded + `avatar_ready` fired.

```
What to build:
- Mount AvatarWebView with opacity:0, position:absolute, width:1, height:1 in layout
- Store ref in React context (AvatarWebViewContext)
- HomeScreen consumes context instead of mounting its own WebView
- On avatar_ready in hidden mount → context signals ready
```

**Complexity:** Medium. Requires context wiring. Do after TASK-01 and TASK-02.

---

## Priority 2 — Offline asset caching (needed before store submission)

### TASK-04: Bundle avatar-embed Locally for Android
**Why:** Android currently loads WebView page from Vercel over network (~1–2s cold). The `file:///android_asset/avatar-web/` path is already referenced in `avatarBridge.js` — just needs the files.

**Steps:**
1. Add to `scripts/build-avatar-embed.mjs` — after esbuild, copy output to `android/app/src/main/assets/avatar-web/`
2. Files to copy: `index.html`, `app.js`, `playback-worklet.js`
3. Add `npm run build:avatar-embed` to prebuild step in `package.json`

```json
"scripts": {
  "prebuild": "npm run build:avatar-embed",
  "build:avatar-embed:android": "node ./scripts/build-avatar-embed.mjs && node ./scripts/copy-avatar-embed-android.mjs"
}
```

4. `bundledAvatarWebViewUrl` in `avatarBridge.js` already returns `file:///android_asset/avatar-web/index.html` for Android — no code change needed there.

**Note for iOS:** iOS uses WKWebView which can load from app bundle too. Use `useWebKit={true}` + `allowFileAccess`. Low priority — add after Android confirmed working.

---

### TASK-05: Download + Cache GLB Avatars On First Launch
**Why:** Avatar GLBs (prithi.glb 8.6MB, Camilia.glb 23MB) load from Vercel on every avatar switch in the WebView. This is the PDF architecture's main recommendation.

**Files:**
- Create `src/utils/assetCache.ts`
- Modify `avatar-embed/src/main.js` to accept `file://` local paths
- Modify `AvatarWebView.js` to pass local URI instead of manifest URL

**Flow:**
```
App launch
  ↓
AvatarPreloadManager (new util)
  ↓ reads manifest.json from WebView (or a bundled copy)
  ↓ checks expo-file-system for each GLB
  ↓ downloads missing ones from CDN to documentDirectory/avatars/
  ↓ stores { prithi: 'file:///...', camilia: 'file:///...' } in MMKV

Avatar switch (setAvatar)
  ↓ look up local path from MMKV
  ↓ if exists → send { type: 'LOAD_AVATAR', path: localPath } to WebView
  ↓ if missing → fall back to CDN URL + trigger background download
```

**avatar-embed/src/main.js change needed:**
```js
// In handleReactNativeMessage, add handler:
if (data.type === 'LOAD_AVATAR') {
  loadAvatar(data.path);  // loader.load() accepts file:// URIs from WebView bridge
}
```

**Important:** `react-native-webview` on Android allows `file://` URIs when `allowFileAccess={true}` and `allowUniversalAccessFromFileURLs={true}` are set. Required for local GLB loading to work.

---

### TASK-06: Move GLB Assets to CDN (Required for Production)
**Why:** Current GLBs served from Vercel (`./avatars/prithi.glb`). Vercel is not CDN-optimised for large binary files. 23MB Camilia will be slow and costly at scale.

**Recommended:** Cloudflare R2 (free egress, S3-compatible) or AWS S3 + CloudFront.

**Steps:**
1. Upload `prithi.glb` and `Camilia.glb` to R2/S3 bucket
2. Update `avatar-embed/avatars/manifest.json` GLB URLs to CDN URLs
3. Update TASK-05 downloader to use CDN URLs as source
4. Keep Vercel deployment for `index.html` + `app.js` only (small, cacheable)

---

## Priority 3 — App Store requirements

### TASK-07: iOS local bundle support
Same as TASK-04 but for iOS. WKWebView can load local files with:
```js
// In AvatarWebView.js for iOS
originWhitelist={['*']}
allowFileAccess={true}
allowFileAccessFromFileURLs={true}
```
Copy avatar-embed to `ios/MBTS3Dnativespike/assets/avatar-web/` in prebuild script.

---

### TASK-08: App Store metadata + permissions audit
**Before submission:**
- [ ] Remove unused permissions from `app.json` / `Info.plist` / `AndroidManifest.xml`
  - Geolocation — used in legacy Home.js only. If not shipping legacy screen, remove.
  - Camera / Gallery — same.
  - Only keep what HomeScreen actually uses.
- [ ] Add `NSCameraUsageDescription`, `NSLocationWhenInUseUsageDescription` strings if keeping
- [ ] Set production `EXPO_PUBLIC_MBTS_API_URL` (not staging Heroku URL)
- [ ] Set `EXPO_PUBLIC_AVATAR_SPEECH_API_URL` to production endpoint
- [ ] Update `app.json` `version` and `android.versionCode`
- [ ] Privacy manifest (iOS 17+ requirement): declare `NSPrivacyAccessedAPITypes` if using file system, UserDefaults, MMKV

---

### TASK-09: APK/AAB size optimisation
**Current problem:** `assets/models/camilia.glb` (23MB) + `assets/models/prithi.glb` (8.6MB) are Metro-bundled into the APK. That's ~32MB added to binary for the Filament spike that isn't used in production.

**Fix:** Exclude GLBs from Metro bundle for production builds.

Option A — remove from `assets/models/` entirely (Filament spike not shipping):
```js
// metro.config.js — add to blockList
blockList: [/assets\/models\/.*/]
```

Option B — lazy download via TASK-05 instead of bundling.

Play Store AAB size limit: 150MB. With models removed, should be well under.

---

## Priority 4 — Nice to have before v1

### TASK-10: Input latency — optimistic UI
**Problem:** User types message, hits send → 300–800ms before avatar starts responding (intent fetch). Screen feels frozen.

**Fix:** Show user message immediately + show typing indicator on avatar side while fetch is in flight. Already has `isReplying` state — wire it to a visible "avatar thinking" animation in the WebView.

---

### TASK-11: Speech queue prefetch
**Problem:** Second message in queue waits for first to finish speaking before TTS fetch begins.

**Fix:** When queue has 2+ items, start TTS fetch for item[1] while item[0] is speaking (check cache first). Store result; inject when item[0] finishes.

---

### TASK-12: Background texture compression for WebView avatars
Current GLBs use meshopt. Consider KTX2 texture compression for smaller downloads and faster GPU upload. Tooling already in devDependencies (`@gltf-transform/cli`, `@gltf-transform/functions`). Can reduce GLB sizes 30–50%.

---

## Execution order

```
Week 1 (now — works on current android dev build):
  TASK-02 → TASK-01 → TASK-03

Week 2 (before EAS build for store):
  TASK-04 → TASK-05 → TASK-06

Week 3 (store submission prep):
  TASK-09 → TASK-08 → TASK-07

Post-launch:
  TASK-10 → TASK-11 → TASK-12
```

---

## Key files reference

| File | Role |
|---|---|
| `src/app/index.tsx` | Speech dispatch, chat state, TASK-01 cache wiring |
| `src/app/_layout.tsx` | Add TASK-02 warmup + TASK-03 preload |
| `src/components/avatar/AvatarWebView.js` | TASK-05 local path injection, TASK-07 iOS flags |
| `src/components/avatar/avatarBridge.js` | Already has `bundledAvatarWebViewUrl` for Android |
| `src/utils/speechCache.ts` | New — TASK-01 |
| `src/utils/assetCache.ts` | New — TASK-05 |
| `avatar-embed/src/main.js` | TASK-05: add `LOAD_AVATAR` handler |
| `avatar-embed/avatars/manifest.json` | TASK-06: update GLB URLs to CDN |
| `scripts/build-avatar-embed.mjs` | TASK-04: add Android asset copy step |
| `android/app/src/main/assets/avatar-web/` | TASK-04: bundled WebView target dir |
| `app.json` | TASK-08: permissions, version, production config |

---

## Production environment variables needed

```bash
EXPO_PUBLIC_MBTS_API_URL=https://[production-backend].herokuapp.com/
EXPO_PUBLIC_AVATAR_SPEECH_API_URL=https://[production-speech].herokuapp.com/
EXPO_PUBLIC_AVATAR_WEB_VIEW_URL=https://[production-vercel-deploy].vercel.app/
```

Set these in EAS `eas.json` under `production` profile, not hardcoded in app.

---

*Plan created: 2026-06-12 | Based on: offline architecture PDF + codebase analysis*
