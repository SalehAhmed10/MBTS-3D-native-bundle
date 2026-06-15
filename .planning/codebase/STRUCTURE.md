# Codebase Structure

_Generated 2026-06-15. Covers the repo root as of commit `c5d2bbf`._

---

## Annotated Directory Tree

```
MBTS-3D-native-spike/
├── android/                    # Ejected React Native Android project
├── android-local-assets/       # Pre-built avatar web bundle; Gradle merges into APK assets
├── assets/                     # Root-level Expo assets (icon, splash, avatar backgrounds)
├── avatar-embed/               # Three.js/TalkingHead source that becomes the WebView page
├── dist-mbts-check/            # Expo web export snapshot (one-off build artifact, not served)
├── docs/                       # Architecture and hand-off documents
├── scripts/                    # Build tooling (avatar bundle pipeline, Expo reset helper)
├── src/                        # All application source code
│   ├── app/                    # Expo Router root (file-based routes)
│   ├── assets/                 # Screen-level images (avatar portraits, UI illustrations)
│   ├── components/             # Shared React Native components
│   │   ├── avatar/             # WebView bridge, session manager, speech provider
│   │   ├── ui/                 # Generic UI primitives
│   │   └── xshare/             # Legacy X-Share feature components
│   ├── constants/              # Design tokens (theme.ts)
│   ├── data/                   # Static JSON-shaped data (avatars.js)
│   ├── hooks/                  # Custom React hooks
│   ├── redux/                  # Redux Toolkit store, slices, reducers, MMKV persistence
│   ├── screens/                # Legacy full-screen views (PascalCase .js)
│   ├── services/               # API helpers and intent handlers
│   ├── types/                  # TypeScript ambient declarations
│   └── utils/                  # Pure utility modules
├── todos/                      # Markdown task notes (not committed to CI)
├── .claude/                    # Claude Code project config
├── .expo/                      # Expo CLI cache (git-ignored in practice)
├── .planning/                  # GSD planning documents (this file lives here)
├── .vscode/                    # VS Code workspace settings
├── app.json                    # Expo app manifest (name: BotCierge, bundle ID: com.mbts.botcierge)
├── babel.config.js             # Babel preset (expo preset)
├── eslint.config.js            # ESLint flat config (expo config)
├── metro.config.js             # Metro bundler config (CSS support enabled)
├── package.json                # NPM manifest; scripts: start, android, ios, web, build:avatar-embed
├── tsconfig.json               # TypeScript config; path alias @ → ./src
├── .env                        # Local secrets (not committed)
└── .env.example                # Environment variable template
```

---

## Per-Directory Purpose

### `src/app/`
Expo Router entry point. Two files only:

| File | Role |
|------|------|
| `_layout.tsx` | Root layout: applies `ThemeProvider`, mounts `AnimatedSplashOverlay`, warms the Heroku TTS dyno via a fire-and-forget health fetch. |
| `index.tsx` | The single production screen (`HomeScreen`). Contains: avatar WebView panel, chat scroll view, speech queue, TTS fetch + cache logic, authentication state machine, background/emotion/voice selectors. ~1 335 lines. |

### `src/components/`
Shared cross-screen components.

| File / sub-dir | Convention | Purpose |
|----------------|------------|---------|
| `avatar/AvatarWebView.js` | Legacy JS | `forwardRef` component that wraps `react-native-webview`. Exposes `setAvatar`, `setMood`, `setBackground`, `speakAudio` via `useImperativeHandle`. |
| `avatar/AvatarWebView.d.ts` | Types | Hand-written type declaration for the JS module. |
| `avatar/avatarBridge.js` | Legacy JS | URL builders (`bundledAvatarWebViewUrl`, `buildAvatarWebViewUrl`), name normalization (`camille` → `camilia`), bridge message helpers. Android path: `file:///android_asset/avatar-web/index.html`. |
| `avatar/avatarSession.js` | Legacy JS | Session-level avatar state helpers. |
| `avatar/speechProvider.js` | Legacy JS | Reads platform and returns `{ mode: 'service' \| 'offline' }` config. |
| `animated-icon.tsx` / `.web.tsx` | Active / platform split | Animated splash overlay. `.web.tsx` variant is used on web. |
| `animated-icon.module.css` | CSS Module | Web-only splash animation styles. |
| `app-tabs.tsx` / `.web.tsx` | Active / platform split | Bottom tab bar. `.web.tsx` uses a DOM-safe alternative. |
| `filament-preview.tsx` / `.web.tsx` | Active / platform split | `react-native-filament` 3D preview spike; `.web.tsx` is a no-op stub. |
| `native-avatar-speech.tsx` | Active | Native TTS path (expo-audio); unused in production flow but kept for spike comparison. |
| `external-link.tsx` | Active | Utility link opener via `expo-web-browser`. |
| `hint-row.tsx` | Active | Small layout helper. |
| `themed-text.tsx` / `themed-view.tsx` | Active | Color-scheme-aware wrappers. |
| `web-badge.tsx` | Active | "Web" indicator badge visible only on web platform. |
| `legacy-mbts-app.js` | Legacy JS | Scaffold for the pre-spike MBTS app navigation (currently not mounted). |
| `ui/collapsible.tsx` | Active | Generic collapsible/accordion. |
| `xshare/PostNeedForm.js` | Legacy JS | X-Share feature form (legacy, not wired to main flow). |
| `*.js` (modals) | Legacy JS | `ActivityLedgerModal`, `AddPhoneNumberModal`, `AddToShoppingListModal`, `CategoryListModal`, `Message`, `ScheduleModal`, `SelectDateAndStoreModal`, `UnitListModal`, `UpdateFulfillment*`, `UpdateShoppingListModal`, `UpdateTodoListModal`, `ViewShoppingListModal`, `ViewTodoListModal`. All are legacy JS; none are mounted in the current spike screen. |

### `src/constants/`
| File | Purpose |
|------|---------|
| `theme.ts` | Shared color tokens (light/dark palettes). |

### `src/data/`
| File | Purpose |
|------|---------|
| `avatars.js` | Static avatar catalog (name, image source, description). Used for UI display; runtime truth comes from `avatars/manifest.json` in the embed. |

### `src/hooks/`
| File | Purpose |
|------|---------|
| `use-color-scheme.ts` | Wraps `useColorScheme` from React Native. |
| `use-color-scheme.web.ts` | Platform override for web (uses `window.matchMedia`). |
| `use-theme.ts` | Derives typed theme values from the active color scheme. |

### `src/redux/`
| File | Purpose |
|------|---------|
| `store/store.js` | Redux store with `redux-persist` + MMKV storage adapter. |
| `storage/storage.js` | `react-native-mmkv-storage` instance shared by the persist config. |
| `reducers/rootReducer.js` | Combines `personSlice`, `postSlice`, `xShareSlice`. |
| `slices/personSlice.js` | Person/user state (legacy MBTS concepts). |
| `slices/postSlice.js` | Post/need state (legacy X-Share). |
| `slices/xShareSlice.js` | X-Share feature state. |

Redux is wired up but the spike's `HomeScreen` does not currently connect to the store; it manages state locally.

### `src/screens/`
Legacy PascalCase `.js` full-screen views carried over from the pre-spike MBTS app. None are mounted in the current Expo Router tree.

| File | Description |
|------|-------------|
| `Home.js` | Old chat/avatar screen (replaced by `src/app/index.tsx`). |
| `AvatarSelection.js` | Avatar picker flow. |
| `AgreementScreen.js` / `ReviewContractScreen.js` | Contract flow. |
| `ActiveNeeds.js` / `MyNeeds.js` / `Bidders.js` | X-Share need marketplace views. |

### `src/services/`
| File | Purpose |
|------|---------|
| `HelperData.js` | Static lookup data used by legacy screens. |
| `intents.js` | Intent request helpers (legacy; duplicated logic now lives inline in `index.tsx`). |

### `src/types/`
| File | Purpose |
|------|---------|
| `assets.d.ts` | Ambient declaration so TypeScript allows `require('*.jpg')` etc. |

### `src/utils/`
| File | Purpose |
|------|---------|
| `api.js` | `baseURL` export (reads `EXPO_PUBLIC_MBTS_API_URL`). |
| `speechCache.ts` | In-memory Map keyed on `(text, avatarId, voiceId)`. `getCachedSpeech` / `cacheSpeech` called from `HomeScreen` to avoid duplicate TTS fetches. |
| `Activity.js` | Legacy activity-log helpers. |
| `agreementTemplates.js` | Legacy agreement string builders. |
| `dateUtils.js` | Legacy date formatting helpers. |

### `src/config.js`
Single source of truth for all URLs and feature flags. Reads `EXPO_PUBLIC_*` env vars with production Heroku fallbacks.

| Export | Value |
|--------|-------|
| `MBTS_API_URL` | Heroku staging backend |
| `AVATAR_SPEECH_API_URL` | Same Heroku app, TTS service |
| `SPEECH_SYNTHESIS_ENDPOINT` | `.../avatarSpeech/synthesize` |
| `SPEECH_HEALTH_ENDPOINT` | `.../avatarSpeech/health` |
| `AVATAR_WEB_VIEW_URL` | Vercel-hosted avatar page (fallback for non-Android) |
| `FEATURES` | `{ enableVoiceInput, enableOfflineMode, enableChatHistory }` |

### `assets/` (root)
Expo-managed static assets referenced by `app.json`: app icon, splash screen foreground, and the `avatar-backgrounds/` sub-folder (bg1-bg5 JPEGs referenced by `require()` in `index.tsx`).

---

## `avatar-embed/` — Internals and Rebuild

The avatar embed is a self-contained, dependency-free web page that runs inside a React Native `WebView`. It renders a 3D talking-head avatar using Three.js + the TalkingHead library and communicates with the host app via `postMessage` / `ReactNativeWebView.postMessage`.

### Directory layout

```
avatar-embed/
├── src/
│   └── main.js               # Build entry point — do not edit app.js directly
├── modules/
│   ├── talkinghead.mjs       # TalkingHead library (animation, lipsync, moods)
│   ├── dynamicbones.mjs      # Cloth/hair physics module used by TalkingHead
│   ├── retargeter.mjs        # Animation retargeting helper
│   └── playback-worklet.js   # AudioWorklet for audio scheduling (copied verbatim to output)
├── vendor/
│   └── three/                # Local copy of Three.js ESM build + addons
├── avatars/
│   ├── manifest.json         # Avatar registry: GLB URL, camera view, voice IDs, scale
│   ├── prithi.glb            # Prithi avatar mesh
│   └── Camilia.glb           # Camilia avatar mesh
├── backgrounds/
│   ├── list.json             # Background file list
│   └── bg1.jpg ... bg5.jpg   # Scene background images
├── index.html                # Shell page; includes fetch->XHR polyfill for Android file://
├── app.js                    # Built output (do not edit — generated by esbuild)
└── playback-worklet.js       # Copied output from modules/ (do not edit)
```

### Message contract (WebView to React Native)

Messages sent **into** the page via `window.ReactNativeWebView.postMessage` or `window.postMessage`:

| `type` | Extra fields | Effect |
|--------|-------------|--------|
| `setAvatar` | `avatar: string` | Loads a different avatar GLB |
| `setMood` | `mood: string` | Changes expression (happy/sad/angry/love/neutral) |
| `setBackground` | `background: string` | Sets CSS background-image (e.g. `bg1.jpg` or `none`) |
| `speakAudio` | `audioBase64`, `words`, `wordTimes`, `wordDurations`, `visemes`, `visemeTimes`, `visemeDurations`, `avatar`, `mood` | Decodes audio and drives lipsync |

Messages posted **out** from the page (`ReactNativeWebView.postMessage`):

| `type` | Payload | Meaning |
|--------|---------|---------|
| `avatar_ready` | `avatar`, `mood`, `background`, `supportedAvatars[]` | Boot complete; sends avatar/voice catalog |
| `speech_started` | `avatar`, `mood` | Audio playback began |
| `speech_finished` | `avatar`, `mood` | Audio + lipsync finished (estimated via duration) |
| `avatar_prefetched` | `avatar` | Idle-time GLB prefetch complete |
| `avatar_error` | `error: string` | Any unhandled error |

### Rebuild steps

```bash
# 1. Edit avatar-embed/src/main.js (or modules/)
# 2. Run the build script:
npm run build:avatar-embed
# Equivalent: node ./scripts/build-avatar-embed.mjs

# What it does:
#   a) esbuild bundles avatar-embed/src/main.js -> avatar-embed/app.js (ESM, browser, no sourcemap)
#   b) Copies modules/playback-worklet.js -> avatar-embed/playback-worklet.js
#   c) Copies index.html, app.js, playback-worklet.js, avatars/, backgrounds/
#      into android-local-assets/avatar-web/

# 3. To add a new avatar:
#   - Drop the .glb file into avatar-embed/avatars/
#   - Add an entry to avatar-embed/avatars/manifest.json
#   - Re-run build:avatar-embed
#   - Rebuild the Android APK
```

---

## `android-local-assets/` — What It Is and How Gradle Consumes It

`android-local-assets/` is a host-project directory that sits **outside** `android/` to survive Gradle clean tasks. It holds the compiled avatar web page:

```
android-local-assets/
└── avatar-web/
    ├── index.html
    ├── app.js                  # Bundled main.js output
    ├── playback-worklet.js
    ├── avatars/
    │   ├── manifest.json
    │   ├── prithi.glb
    │   └── Camilia.glb
    └── backgrounds/
        └── bg1.jpg ... bg5.jpg
```

### Gradle wiring

In `android/app/build.gradle`, the `android.sourceSets.main.assets.srcDirs` list is extended:

```groovy
sourceSets {
    main {
        assets.srcDirs += ["${projectRoot}/android-local-assets"]
    }
}
```

`projectRoot` resolves to the repo root (`rootDir.parentFile.absolutePath`). Gradle merges everything under `android-local-assets/` into the APK asset directory at build time, so at runtime the file is accessible at:

```
file:///android_asset/avatar-web/index.html
```

This path is hardcoded in `src/components/avatar/avatarBridge.js` as `bundledAvatarWebViewUrl` for the Android platform, bypassing network entirely.

**To update the on-device bundle:** run `npm run build:avatar-embed`, then rebuild the Android APK with `npm run android` or `expo run:android`.

---

## `dist-mbts-check/` — Expo Web Export Artifact

This directory is a snapshot produced by `expo export --platform web` (the `dist-mbts-check` name was chosen to distinguish it from a default `dist/` folder). It is **not actively served** — it exists as a one-off sanity check that the web build compiles without errors.

Contents: hashed asset files (`dist-mbts-check/assets/<hash>`) and `index.html`. It is safe to delete; re-generate with:

```bash
npx expo export --platform web --output-dir dist-mbts-check
```

It is excluded from Android/iOS builds and is not referenced by any runtime code.

---

## `android/` — Native Android Project

Standard Expo/React Native Android project produced by `expo prebuild` and subsequently ejected.

```
android/
├── app/
│   ├── build.gradle           # App-level Gradle config (see below)
│   ├── debug.keystore         # DEBUG signing key — NOT for production
│   ├── proguard-rules.pro     # ProGuard rules (minify disabled by default)
│   └── src/
│       ├── main/
│       │   └── AndroidManifest.xml
│       ├── debug/
│       │   └── AndroidManifest.xml
│       └── debugOptimized/
│           └── AndroidManifest.xml
├── build.gradle               # Project-level Gradle config
├── settings.gradle            # Module declarations, plugin management
├── gradle.properties          # SDK versions, Hermes flag, packaging options
├── gradle/wrapper/
│   └── gradle-wrapper.properties  # Gradle 9.3.1
├── gradlew / gradlew.bat      # Gradle wrapper scripts
└── .gradle/                   # Gradle build cache (git-ignored)
```

### Key Gradle notes

- **Bundle command:** `bundleCommand = "export:embed"` — uses Expo CLI to bundle JS, not the raw Metro CLI.
- **Hermes:** enabled via `gradle.properties`; JSC is the fallback.
- **Asset injection:** `assets.srcDirs += ["${projectRoot}/android-local-assets"]` merges the avatar web bundle.
- **Application ID:** `com.mbts.botcierge`.
- `react { autolinkLibrariesWithApp() }` handles native module linking automatically.

### Debug keystore warning

`android/app/debug.keystore` is committed to the repository. This is the standard Android debug key (password `android`, alias `androiddebugkey`) and is acceptable for development builds only.

**The release build also currently uses the debug key** (`signingConfig signingConfigs.debug` in the `release` build type). Before publishing to Google Play, generate a proper release keystore and update `build.gradle` accordingly. See [React Native docs — Signed APK](https://reactnative.dev/docs/signed-apk-android).

---

## `scripts/`

| File | Type | Purpose |
|------|------|---------|
| `build-avatar-embed.mjs` | ESM Node script | Full avatar build pipeline. See rebuild instructions above. |
| `reset-project.js` | CommonJS Node script | Expo scaffold helper: prompts to move `src/` and `scripts/` to `example/` and create a blank `src/app/`. Run once, then delete. `npm run reset-project`. |

### `build-avatar-embed.mjs` pipeline in detail

1. **esbuild bundle** — `avatar-embed/src/main.js` to `avatar-embed/app.js`. Format: ESM. Target: `chrome109`, `safari16`. No sourcemaps.
2. **Worklet copy** — `avatar-embed/modules/playback-worklet.js` to `avatar-embed/playback-worklet.js`.
3. **Android asset copy** — Creates `android-local-assets/avatar-web/` and copies:
   - `index.html`, `app.js`, `playback-worklet.js`
   - `avatars/manifest.json`, `avatars/prithi.glb`, `avatars/Camilia.glb`
   - `backgrounds/bg1.jpg` through `bg5.jpg`

The script does **not** copy the `vendor/` or `modules/` directories — Three.js and TalkingHead are bundled by esbuild into `app.js`.

---

## Naming Conventions

Three distinct conventions coexist due to the project's migration history:

### Active code (new spike files) — kebab-case `.tsx`
Files added during the 3D/avatar spike follow Expo Router convention:
- `animated-icon.tsx`, `app-tabs.tsx`, `filament-preview.tsx`, `hint-row.tsx`
- `themed-text.tsx`, `themed-view.tsx`, `web-badge.tsx`, `external-link.tsx`
- `native-avatar-speech.tsx`, `use-color-scheme.ts`, `use-theme.ts`

### Legacy MBTS code — PascalCase `.js`
Files ported from the pre-spike React Native MBTS app retain the original style:
- `src/screens/Home.js`, `AvatarSelection.js`, `ActiveNeeds.js`, etc.
- `src/components/Message.js`, `AddToShoppingListModal.js`, etc.
- `src/components/avatar/AvatarWebView.js`, `avatarBridge.js`, `speechProvider.js`
- `src/redux/**/*.js`

### Platform splits — `.web.tsx` / `.web.ts`
When a component needs a different implementation on web vs. native, Metro/Expo Router resolves the `.web.*` variant automatically on web:

| Native file | Web override | Difference |
|-------------|-------------|------------|
| `animated-icon.tsx` | `animated-icon.web.tsx` | Uses CSS animation instead of `Animated` |
| `app-tabs.tsx` | `app-tabs.web.tsx` | DOM-safe tab bar |
| `filament-preview.tsx` | `filament-preview.web.tsx` | No-op stub (Filament is native-only) |
| `use-color-scheme.ts` | `use-color-scheme.web.ts` | `window.matchMedia` instead of RN hook |

---

## Where to Add New Code

| What you are adding | Where it goes | Convention |
|--------------------|--------------|------------|
| New route / screen | `src/app/<name>.tsx` | kebab-case, `.tsx` |
| Shared UI component (new) | `src/components/<name>.tsx` | kebab-case, `.tsx` |
| Platform-split component | `src/components/<name>.tsx` + `src/components/<name>.web.tsx` | kebab-case, platform suffix |
| New avatar GLB | `avatar-embed/avatars/<name>.glb` + entry in `avatar-embed/avatars/manifest.json`, then `npm run build:avatar-embed` | lowercase, no spaces |
| Background image | `avatar-embed/backgrounds/<name>.jpg`, add to `build-avatar-embed.mjs` copy loop, add to `BACKGROUND_OPTIONS` in `src/app/index.tsx`, add to `assets/avatar-backgrounds/` for native `require()` | `bgN.jpg` pattern |
| Feature flag | `src/config.js` — add to `FEATURES` object | camelCase key |
| Redux slice | `src/redux/slices/<name>Slice.js`, wire into `src/redux/reducers/rootReducer.js` | camelCase slice name |
| New env variable | Add to `.env.example`; read in `src/config.js` via `process.env.EXPO_PUBLIC_*` | `EXPO_PUBLIC_` prefix required for Metro |
| Native module (Android hook) | `android/app/src/main/` — follow Expo autolinking | standard RN native module layout |
| Design token | `src/constants/theme.ts` | TypeScript constant |
| Utility function | `src/utils/<name>.ts` | kebab-case, `.ts` preferred for new files |
