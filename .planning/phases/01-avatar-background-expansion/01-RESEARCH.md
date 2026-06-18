# Phase 1 Research: Avatar & Background Expansion

**Researched:** 2026-06-15
**Domain:** React Native / Expo — WebView bridge, Android asset bundling, APK size management
**Confidence:** HIGH (all findings verified directly from codebase inspection)

---

## Summary

Five key findings that govern how this phase must be planned:

1. **The APK is already 147MB — 47MB over budget.** The size driver is not the GLB files in
   `assets/models/`, which are already blocked by Metro's `blockList`. The 107.6MB `lib/` layer
   is `react-native-filament`'s compiled native `.so` files bundled into every build. Removing
   `react-native-filament` from `package.json` and uninstalling it is the only path to getting
   under 100MB — deleting the two dead `.tsx` files alone saves zero bytes from the APK.

2. **Benji.glb (31MB) cannot be bundled in the APK given the 100MB budget.** Even after Filament
   removal, the size math shows bundling all four new GLBs leaves almost nothing for the RN JS
   bundle (~14MB dex) and other assets. John and Prithi (5.9MB + 8.6MB) can be bundled.
   Benjamin must be download-on-first-use from the web version's CDN or Vercel.

3. **The postMessage bridge is fully generic — adding avatars requires zero changes to
   `AvatarWebView.js`.** The Three.js side receives avatar config entirely from
   `avatar-embed/avatars/manifest.json`. The RN side sends `{ type: 'setAvatar', avatar: 'john' }`
   and the WebView looks up camera settings, voice, and GLB URL from the manifest. The only
   wiring change needed is: add entries to `manifest.json` and update `avatarBridge.js`'s
   `AVATAR_NAME_MAP` and `AVATAR_ID_MAP` for the new names.

4. **`DEFAULT_AVATAR_OPTIONS` in `index.tsx` is overwritten at runtime by the `avatar_ready`
   event.** The WebView's `handleReactNativeMessage` boot sends `supportedAvatars[]` populated
   from the manifest, and `hydrateAvatarOptions()` replaces the static array. The static
   `DEFAULT_AVATAR_OPTIONS` is only a UI loading-state fallback — it does not need to list all 5
   avatars for them to appear in the picker. However, the voice IDs in `DEFAULT_AVATAR_OPTIONS`
   drive the TTS `voiceId` sent to the backend, so the static array must still be updated with
   real voice IDs (af_bella, ef_dora, am_fenrir) to prevent wrong-voice TTS calls during the
   brief pre-ready window.

5. **margie.glb does not exist in either codebase** (MYBOTSTV or the spike). REQUIREMENTS.md
   already acknowledges this: "Margie avatar — margie.glb not confirmed available yet." Margie
   is excluded from this phase.

---

## Avatar Wiring (postMessage bridge)

### How RN sends avatar config to the WebView

The bridge uses `injectJavaScript()` with a payload serialized via `buildAvatarInjection()`:

```js
// avatarBridge.js
export const buildAvatarInjection = payload =>
  `window.handleReactNativeMessage && window.handleReactNativeMessage(${JSON.stringify(payload)}); true;`;
```

The WebView's `window.handleReactNativeMessage` (defined in `avatar-embed/src/main.js`) receives:

| Message type | Fields | Effect in WebView |
|---|---|---|
| `setAvatar` | `avatar: string` | Calls `loadAvatar(key)` which reads the manifest for GLB URL + camera view |
| `setBackground` | `background: string` | Calls `applyBackground(id)` — sets CSS `backgroundImage` on `#avatar` element |
| `setMood` | `mood: string` | Calls `applyMood(mood)` on TalkingHead |
| `speakAudio` | full payload | Decodes base64 audio, drives lipsync |

### How camera settings are applied

Camera settings (cameraY, cameraFOV, cameraRotateX, cameraRotateY, cameraRotateZ) live entirely
in the WebView side. When `loadAvatar(key)` is called, the Three.js code runs:

```js
// avatar-embed/src/main.js
head.setView(head.viewName, person.view || {});
if (person.view?.cameraFOV !== undefined && head.camera) {
  head.camera.fov = person.view.cameraFOV;
  head.camera.updateProjectionMatrix();
}
```

The `person.view` object comes from `manifest.json`. RN does not send camera settings at all —
they are declarative in the manifest entry.

### How avatar options flow back to RN

On boot, the WebView posts:
```json
{ "type": "avatar_ready", "supportedAvatars": [ { "id": "...", "label": "...", "voices": [...] } ] }
```

`hydrateAvatarOptions()` in `index.tsx` replaces `DEFAULT_AVATAR_OPTIONS` with this list. The
picker dropdown immediately reflects the avatars declared in `manifest.json`.

### What must change in the bridge for new avatars

1. **`AVATAR_NAME_MAP` in `avatarBridge.js`** — currently only maps `camille → camilia`. Must
   add mappings for any alternative spellings of new avatar names that the UI might send.
   Recommendation: add `benjamin → benjamin`, `john → john` (identity mappings are not needed
   but make the contract explicit).

2. **`AVATAR_ID_MAP` in `avatarBridge.js`** — maps normalized ID to display label for
   `denormalizeAvatarName()`. Must add `benjamin → "Benjamin"`, `john → "John"`.

3. **`buildEmbedBootstrapScript` in `AvatarWebView.js`** — line 32 has a hardcoded
   `desiredLabel` lookup: `avatar === 'camilia' ? 'Camilia' : 'Prithi'`. This must be removed or
   replaced with a generic lookup (e.g., capitalize first letter, or derive from the manifest).
   If left as-is, switching to Benjamin will set `desiredLabel = 'Prithi'` in the DOM.

4. **`manifest.json`** — must add entries for `benjamin`, `john` (and `margie` when GLB
   is delivered). Each entry needs: `url`, `body`, `defaultMood`, `scale`, `view` (camera
   settings), `defaultVoiceId`, `voices[]`.

5. **`DEFAULT_AVATAR_OPTIONS` in `index.tsx`** — must include real voice IDs for all available
   avatars so TTS calls during pre-ready state use the correct voice. Camille → `af_bella`,
   Prithi → `ef_dora`, Benjamin → `am_fenrir`, John → `am_fenrir`.

### Camera settings to use (from MYBOTSTV AVATAR_OBJECTS)

| Avatar | cameraY | cameraX | cameraFOV | cameraRotateX | cameraRotateY | cameraRotateZ | voice |
|---|---|---|---|---|---|---|---|
| Camille | -0.7 | 0.0 | 10 | -0.1 | 0.0 | 2 | af_bella |
| Prithi | 0.1 | 0.0 | 10 | -0.1 | 0.0 | 2 | ef_dora |
| Benjamin | 0.1 | 0.0 | 10 | -0.1 | 0.0 | 2 | am_fenrir |
| John | 0.1 | 0.0 | 10 | -0.1 | 0.0 | 2 | am_fenrir |

**Note:** The spike's current manifest uses different cameraFOV values (5-6) than the web
version (10). The web values should be treated as the authoritative reference. Test visually
after updating — different GLBs have different default scales and may need adjusted values.

---

## GLB Bundling Decision

### Current APK size breakdown (release build, verified by APK zip analysis)

| APK layer | Size | Driver |
|---|---|---|
| `lib/` (native .so) | 107.6MB | **react-native-filament** renderer compiled for ARM/x86 |
| `root/` (dex/classes) | 50.2MB | JS bundle + all RN deps compiled to Dalvik bytecode |
| `assets/` | 20.5MB | WebView bundle + current GLBs (Camilia 2.8MB, prithi 8.6MB) + backgrounds |
| `res/`, `META-INF`, etc | ~5MB | Standard Android resources |
| **Total** | **~183MB uncompressed** | **Actual APK: 147MB (compressed)** |

### Why the current APK is 147MB

`react-native-filament` ships prebuilt native `.so` files for multiple ABIs (arm64-v8a, x86_64)
compiled into the APK via its AAR. These are dead code because `filament-preview.tsx` is not
imported by any active file, but the native library is linked at the Gradle level via
`react { autolinkLibrariesWithApp() }` — so it is included in every build regardless.

**Removing `react-native-filament` from `package.json` is mandatory to reach 100MB.** This
requires: uninstall the package, remove it from `package.json`, re-run `expo prebuild` or
manually unlink from the Gradle autolinking, rebuild. The estimated saving is ~60-80MB in the
`lib/` layer.

### Size math after Filament removal (estimated)

| Component | Size |
|---|---|
| `lib/` after Filament removal | ~30-40MB (remaining RN native deps) |
| `root/` dex (rough estimate) | ~35-40MB |
| Current avatar assets (Camilia + prithi) | 11.4MB |
| + john.glb | 5.9MB |
| + backgrounds (5 current) | ~2.3MB |
| **Subtotal without Benjamin** | **~85-100MB** |
| + Benji.glb bundled | +31MB → **~116-131MB** — **OVER BUDGET** |

**Decision: John bundles, Benjamin does not.**

- Camille (2.8MB), Prithi (8.6MB), John (5.9MB) → all bundled in `android-local-assets/`
- Benjamin (31MB) → lazy-load on first use: download to device cache directory, persist across
  sessions. Use `expo-file-system` (`FileSystem.downloadAsync`) to fetch from the web version's
  hosted URL (MYBOTSTV's Vercel deployment at `/avatars/Benji.glb`).

### Benjamin lazy-load implementation notes

- Download URL: `https://mbts-3-d-native-bundle.vercel.app/avatars/Benji.glb` (or the web
  version Vercel URL — must be confirmed as the correct CDN endpoint)
- Storage path: `FileSystem.cacheDirectory + 'avatars/Benji.glb'`
- Strategy: When user selects Benjamin, check if file exists in cache; if not, show download
  progress UI, download, then set avatar. A one-time 31MB download on WiFi is acceptable UX.
- The WebView must be able to fetch from the cache directory path. On Android, `file://` paths
  within the app's cache are accessible to the WebView when `allowFileAccessFromFileURLs={true}`.
  However, `avatar-embed/src/main.js` constructs GLB URLs relative to `window.location.href`
  (which is `file:///android_asset/avatar-web/`). A lazy-loaded GLB in the cache directory
  cannot be reached via the relative URL. **Solution:** The manifest entry for `benjamin` must
  use a URL that can be overridden at runtime. The simplest approach is to not add `benjamin` to
  the manifest with a relative URL, but instead send a `setAvatar` message with an absolute
  `file://` path — this requires a `url` override field in the `setAvatar` message type.
  Alternatively: after download, serve the file via a local HTTP server (e.g., `expo-local-server`)
  or copy it to the android-local-assets equivalent path. **This is the most complex open
  question in Phase 1.**

### Note on `assets/models/` Filament GLBs

`assets/models/camilia.glb` (23MB) and `assets/models/prithi.glb` (8.6MB) exist at the project
root but are NOT in the APK. The Metro `blockList` prevents them from being bundled via the JS
asset pipeline. No active file imports them (only the dead `filament-preview.tsx` which is itself
not imported). However, they consume ~32MB of disk space and commit history. They should be
deleted as part of APK-01 for cleanliness even though their deletion does not change APK size.

---

## Background Gallery Implementation

### Current state

`avatar-embed/backgrounds/` has 5 files: `bg1.jpg` through `bg5.jpg`. The web version
(`MYBOTSTV`) has 17 richer backgrounds in two galleries: 11 city scenes and 6 thematic scenes.

The background list is declared in `avatar-embed/backgrounds/list.json` and drives the WebView's
background picker UI. The RN side uses `BACKGROUND_OPTIONS` in `index.tsx` and sends
`{ type: 'setBackground', background: 'filename.jpg' }` to the WebView.

### How backgrounds are applied in the WebView

`applyBackground()` in `avatar-embed/src/main.js` builds the image URL relative to the WebView's
origin and sets `avatarEl.style.backgroundImage`. The bootstrap injection script in
`AvatarWebView.js` also syncs the background on every load/reload via `syncBackgroundSelection()`.

Both paths use the same pattern:
```js
const backgroundUrl = new URL(`./backgrounds/${backgroundId}`, window.location.href).href;
// On Android: file:///android_asset/avatar-web/backgrounds/bg1.jpg
```

### What the plan must do

1. **Copy web background JPGs** from `MYBOTSTV/public/` to `avatar-embed/backgrounds/`. Target
   set from `BG_GALLERY` in MYBOTSTV App.js: 11 cities + 6 scenes = 17 files.

2. **However: 17 raw JPGs total 64MB — too large to bundle all.** The web version's raw files
   were not optimized for mobile. A selection strategy is needed:
   - **Recommended approach:** Bundle 8 backgrounds (meeting BG-01's minimum). Pick the 8
     smallest files from the BG_GALLERY list. Then optionally make the remaining ones available
     as remote URLs (treated the same as Benjamin GLB — load from Vercel on demand).
   - **Or:** Resize/compress all 17 to ≤200KB each before bundling. At 200KB × 17 = 3.4MB
     total, all 17 would fit comfortably.

3. **Update `avatar-embed/backgrounds/list.json`** to include all bundled background filenames.

4. **Update `BACKGROUND_OPTIONS`** in `src/app/index.tsx` to list the new backgrounds. Each
   entry needs: `id` (filename), `label` (display name), `color` (fallback color), `source`
   (React Native `require()` path for the thumbnail in the dropdown).

5. **Add background JPGs to `assets/avatar-backgrounds/`** (the RN `require()` source for
   thumbnails). Currently this folder has `bg1.jpg`..`bg5.jpg`. New files must be added here too
   so the dropdown's `renderLeftIcon` thumbnail can show a preview.

6. **Update `build-avatar-embed.mjs`** to copy new background files in the build loop.

7. **BG-03: Background persistence** — currently `selectedBackgroundId` is ephemeral React
   state, lost on app restart. The plan must add persistence. Mechanism: `expo-secure-store` or
   `AsyncStorage` to save and restore `selectedBackgroundId` on mount. This is 4-5 lines of
   code in `index.tsx`. The backend user profile sync mentioned in BG-03 is a backend call —
   the existing `requests/requestHandler` endpoint likely handles this, but this needs
   verification. For Phase 1, local persistence is the minimum viable implementation.

---

## Filament Removal — Safe Paths

### What to delete

| File/Directory | Size | Safe to delete? |
|---|---|---|
| `assets/models/camilia.glb` | 23MB | YES — nothing in active codebase imports this (Metro blocks it) |
| `assets/models/prithi.glb` | 8.6MB | YES — same reason |
| `assets/models/` directory | — | YES after deleting above |
| `src/components/filament-preview.tsx` | — | YES — only imported by native-avatar-speech.tsx (also dead) |
| `src/components/filament-preview.web.tsx` | — | YES — paired web stub |
| `src/components/native-avatar-speech.tsx` | — | YES — not imported by any active file |

**Verified:** `grep` across all `.ts/.tsx/.js` files confirms no active file imports either
component. The only import chain is `native-avatar-speech.tsx → filament-preview.tsx`, and
`native-avatar-speech.tsx` itself is imported by nothing.

### What else must change for Filament removal

Deleting the files and GLBs is not sufficient — `react-native-filament` must be uninstalled from
`package.json`. Without uninstalling the package:
- Gradle autolinking continues to link the native `.so` files into the APK
- The APK size does not decrease
- CMake artifacts in `android/app/.cxx/` from the Filament build remain stale

Steps required:
1. `npm uninstall react-native-filament react-native-worklets-core react-native-worklets`
   (Filament's peer dependencies that have no other use)
2. Verify `package.json` no longer references these packages
3. Delete `android/app/.cxx/` (stale CMake artifacts from Filament compilation)
4. Remove the `config.resolver.blockList` entry from `metro.config.js` (no longer needed once
   `assets/models/` is deleted)
5. Clean and rebuild Android: `cd android && ./gradlew clean`, then `npm run android`

**Risk:** `react-native-worklets-core` may be a peer dependency of `react-native-reanimated`
as well as Filament. Check before uninstalling — running `npm ls react-native-worklets-core`
will show the dependency tree. Do not uninstall if reanimated requires it.

### Checking for Filament-related `metro.config.js` cleanup

After removing `assets/models/` and uninstalling Filament, the `blockList` entry
`/assets[/\\]models[/\\].*/` in `metro.config.js` is dead. It should be removed to keep the
config clean. The `config.resolver.assetExts.push("glb")` entry may also be removable if no
active code uses Metro-resolved GLBs — but it is harmless if kept.

---

## Build Script Impact

### What `build-avatar-embed.mjs` currently does

1. Bundles `avatar-embed/src/main.js` → `avatar-embed/app.js` via esbuild
2. Copies `playback-worklet.js`
3. Copies `index.html`, `app.js`, `playback-worklet.js` to `android-local-assets/avatar-web/`
4. Copies `avatars/manifest.json`, `avatars/prithi.glb`, `avatars/Camilia.glb`
5. Copies `backgrounds/bg1.jpg` through `bg5.jpg` in a hardcoded loop

### What must change

The script has **hardcoded filenames** in two places:

**Avatar GLBs (line 44-45):**
```js
await cp(path.join(embedDir, "avatars", "prithi.glb"), ...);
await cp(path.join(embedDir, "avatars", "Camilia.glb"), ...);
```
Must add lines for `john.glb` and optionally `Benji.glb` (if Benji is bundled — which per the
size math above, it should NOT be).

**Recommended change:** Replace the hardcoded avatar copy section with a glob that copies all
`*.glb` files in `avatar-embed/avatars/`. This makes the script future-proof:
```js
const { glob } = await import('glob'); // or use fs.readdirSync
const glbs = fs.readdirSync(path.join(embedDir, 'avatars')).filter(f => f.endsWith('.glb'));
for (const glb of glbs) {
  await cp(path.join(embedDir, 'avatars', glb), path.join(androidLocalAssetsDir, 'avatars', glb));
}
```

**Background images (lines 48-50):**
```js
for (const bg of ["bg1.jpg", "bg2.jpg", "bg3.jpg", "bg4.jpg", "bg5.jpg"]) { ... }
```
Must be updated to list all new background filenames, or switched to a glob of all `*.jpg` files
in `avatar-embed/backgrounds/`.

**Recommended change:** Read from `list.json` dynamically, or glob all `*.jpg`:
```js
const bgs = fs.readdirSync(path.join(embedDir, 'backgrounds')).filter(f => f.endsWith('.jpg'));
for (const bg of bgs) {
  await cp(path.join(embedDir, 'backgrounds', bg), path.join(androidLocalAssetsDir, 'backgrounds', bg));
}
```

**No esbuild changes needed.** The esbuild step bundles `src/main.js` which imports the manifest
at runtime (via `fetch`), not at build time. Adding new avatar entries to `manifest.json` does
not require touching the build configuration.

---

## Open Questions / Risks

### 1. Benjamin lazy-load: WebView URL resolution

**Problem:** The WebView's Three.js code constructs GLB URLs relative to
`file:///android_asset/avatar-web/`. A lazy-downloaded GLB at
`file:///data/data/com.mbts.botcierge/cache/avatars/Benji.glb` cannot be referenced via a
relative manifest URL. The manifest entry would need an absolute `file://` path, but the manifest
is bundled at build time and can't know the runtime cache path.

**Potential solutions (in order of complexity):**
  - A) Add a `url_override` field to the `setAvatar` postMessage so RN can pass the absolute
    cache path to the WebView at selection time. The WebView's `handleReactNativeMessage` would
    use this override instead of the manifest URL.
  - B) After download, copy Benji.glb into a directory served via a local HTTP server
    (expo-local-server or a custom HTTP server within the React Native app).
  - C) Abandon the manifset approach for Benjamin and hardcode the download URL in a special
    case in the WebView code.

Option A is the cleanest and requires changes to: `avatar-embed/src/main.js` (handle
`url_override` in `loadAvatar`), `manifest.json` (add placeholder Benjamin entry with no URL),
`AvatarWebView.js` (pass `url_override` in `setAvatar` message when a local path is known).

**This is the highest-complexity item in Phase 1** and the plan must include a concrete approach.

### 2. Filament uninstall may require manual Gradle cleanup

Expo's autolinking reads from `node_modules` at build time. After `npm uninstall
react-native-filament`, the next `npm run android` should automatically exclude the native
library. However, if the `android/app/.cxx/` CMake cache retains a reference, the build may
fail with a missing library error. Running `cd android && ./gradlew clean` before rebuilding
eliminates this risk.

### 3. Background image sizes from MYBOTSTV are too large to bundle raw

`bg_autumn_forest.jpg` alone is 17.5MB. All 17 files total 64MB uncompressed. Must resize/
compress all images before adding to `avatar-embed/backgrounds/`. Target: ≤200KB per file.
Tools: `sharp` (Node.js), `ffmpeg`, or an ImageMagick one-liner.

### 4. BG-03 background persistence scope — local vs backend

The requirement says "persists to user profile (backend sync)". Implementing backend sync would
require a new or modified `requests/requestHandler` call with the selected background ID. This
is a backend contract change. For Phase 1 the plan should implement local persistence
(AsyncStorage) and flag the backend sync as a follow-up, unless the backend already supports
a `preferences.backgroundId` field.

### 5. Camilla.glb version discrepancy

The spike's `avatar-embed/avatars/Camilia.glb` is 2.8MB. The MYBOTSTV version is 8MB — 2.8x
larger, likely a higher-quality/higher-resolution version. The plan should clarify which version
to use. If the higher-quality version is adopted, this adds ~5MB to the APK.

### 6. margie.glb does not exist

No `margie.glb` file exists in MYBOTSTV or the spike. The requirements already defer Margie
to "when asset delivered". The plan must explicitly skip Margie in Phase 1.

---

## Asset Size Reference Table

| Asset | Size | Bundled? |
|---|---|---|
| `Camilia.glb` (spike version) | 2.8MB | Yes |
| `prithi.glb` | 8.6MB | Yes |
| `john.glb` | 5.9MB | Yes |
| `Benji.glb` | 31.0MB | No — lazy-load |
| `margie.glb` | N/A | N/A — asset not available |
| Background images (8 selected, compressed) | ~1.5MB est. | Yes |
| `app.js` (Three.js bundle) | 1.8MB | Yes |
| `index.html` + worklet | ~12KB | Yes |

**Post-Filament-removal APK estimate:** ~80-95MB (within budget, with margin for John + 8 BGs).

---

## Sources

All findings are verified by direct inspection of the codebase:

- `src/components/avatar/AvatarWebView.js` — bridge internals, message flow
- `src/components/avatar/avatarBridge.js` — name maps, URL builders
- `avatar-embed/src/main.js` — WebView-side message handler, camera application, background
- `avatar-embed/avatars/manifest.json` — current avatar registry schema
- `src/app/index.tsx` — `DEFAULT_AVATAR_OPTIONS`, `BACKGROUND_OPTIONS`, `hydrateAvatarOptions`
- `scripts/build-avatar-embed.mjs` — hardcoded copy list
- `MYBOTSTV/src/control/botciergeController.js` — `AVATAR_OBJECTS` with camera settings and voices
- `MYBOTSTV/src/App.js` — `BG_GALLERY`, `BG_CITIES`, `BG_SCENES` reference lists
- `MYBOTSTV/public/avatars/` — GLB file sizes
- `MYBOTSTV/public/bg_*.jpg` — background image files (17 files, 64MB total)
- APK zip analysis (PowerShell) — layer breakdown showing `lib/` = 107.6MB
- `assets/models/` — Filament GLBs present at project root (23MB + 8.6MB)

[VERIFIED: direct file inspection] All size claims, file locations, and code references above.
[ASSUMED] APK size after Filament removal is estimated — actual size will only be known after
running a clean build without `react-native-filament`.
