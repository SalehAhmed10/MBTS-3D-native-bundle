# Technology Stack

**Analysis Date:** 2026-06-15

## Languages

**Primary:**
- TypeScript ~6.0.3 — all new source under `src/` (strict mode, `checkJs: false` for JS files)
- JavaScript — legacy screens and components (`src/screens/Home.js`, redux slices, avatar embed)

**Secondary:**
- Kotlin — Android native layer (applied via `org.jetbrains.kotlin.android` Gradle plugin)
- HTML/CSS/JS — avatar embed WebView page (`avatar-embed/`)

## Runtime

**Environment:**
- Node.js — build tooling and scripts only; app runs on device

**JS Engine:**
- Hermes — enabled (`hermesEnabled=true` in `android/gradle.properties`); JSC available as fallback via `io.github.react-native-community:jsc-android:2026004.+`

**Package Manager:**
- npm (lockfile: `package-lock.json` present)

## Frameworks

**Core:**
- Expo SDK ~56.0.8 — managed workflow with bare Android folder
- React 19.2.3
- React Native 0.85.3

**Navigation:**
- Expo Router ~56.2.7 — file-based routing; `main` entry is `expo-router/entry`; app root is `src/app/_layout.tsx`
- `@react-navigation/native` ^7.2.5 — peer dep for Expo Router
- `@react-navigation/native-stack` ^7.16.0
- `@react-navigation/drawer` ^7.10.3

**3D Rendering — Avatar Embed (WebView layer, production path):**
- `three` ^0.184.0 (devDependency) — bundled into `avatar-embed/app.js` via esbuild at build time
- `TalkingHead` (`avatar-embed/modules/talkinghead.mjs`) — custom lip-sync + morph-target animation library driving GLB avatars via Three.js
- GLB avatar models: `avatar-embed/avatars/prithi.glb` (8.6 MB), `avatar-embed/avatars/Camilia.glb` (2.7 MB)
- Rendering runs inside a `react-native-webview` WebView, NOT in a native GL context
- Android: served from local filesystem `file:///android_asset/avatar-web/index.html`
- iOS: served from hosted Vercel URL (`EXPO_PUBLIC_AVATAR_WEB_VIEW_URL`)

**3D Rendering — Native (spike / dead code, NOT in production):**
- `react-native-filament` ^1.11.0 — Filament-based native 3D renderer; installed but blocked from Metro bundle via `config.resolver.blockList` (see `metro.config.js`)
- `src/components/filament-preview.tsx` and `src/components/native-avatar-speech.tsx` are dead code kept for spike reference only

**Build/Dev:**
- esbuild ^0.28.0 — bundles `avatar-embed/src/main.js` → `avatar-embed/app.js` via `scripts/build-avatar-embed.mjs`; targets `chrome109`, `safari16`
- babel-preset-expo — JS/TS transpilation
- react-native-reanimated/plugin (Babel plugin, `processNestedWorklets: true`)
- eslint ^9.0.0 + eslint-config-expo ~56.0.4

## Key Dependencies

**State Management:**
- `@reduxjs/toolkit` ^2.12.0 + `redux` ^5.0.1 + `react-redux` ^9.3.0
- `redux-persist` ^6.0.0 — persists Redux state to MMKV
- `redux-thunk` ^3.1.0 — async action middleware
- `react-native-mmkv-storage` ^12.0.1 — MMKV-based storage adapter for redux-persist

**Networking:**
- `axios` ^1.16.1 — used in redux slices (`src/redux/slices/xShareSlice.js`)
- `fetch` (native) — used throughout `src/app/index.tsx` and `src/screens/Home.js`

**UI Components:**
- `@rneui/base` ^5.0.0 + `@rneui/themed` ^5.0.0 — React Native Elements UI kit
- `@expo/ui` ~56.0.14 — Expo UI primitives
- `expo-glass-effect` ~56.0.4
- `expo-symbols` ~56.0.5
- `react-native-gesture-handler` ~2.31.1
- `react-native-safe-area-context` ~5.7.0
- `react-native-screens` 4.25.2
- `react-native-reanimated` 4.3.1
- `react-native-modal` ^14.0.0-rc.1 — **WARNING: release candidate, not stable**
- `react-native-dropdown-picker` ^5.4.6
- `react-native-element-dropdown` ^2.12.4
- `react-native-numeric-input` ^1.9.1
- `react-native-international-phone-number` ^0.11.6
- `react-native-vector-icons` ^10.3.0
- `expo-image` ~56.0.9

**Media / Device:**
- `expo-audio` ~56.0.11 — audio playback; microphone permission explicitly disabled in `app.json`
- `expo-file-system` ~56.0.7 — used for TTS speech cache (`src/utils/speechCache.ts`)
- `react-native-image-picker` ^8.2.1
- `react-native-geolocation-service` ^5.3.1
- `react-native-permissions` ^5.5.2

**WebView (load-bearing):**
- `react-native-webview` ^13.16.1 — the entire avatar surface is delivered through this; removing it breaks avatar rendering entirely

**Worklets:**
- `react-native-worklets` 0.8.3
- `react-native-worklets-core` ^1.6.3

**Date / Utilities:**
- `date-fns` ^4.3.0
- `@react-native-community/datetimepicker` ^9.1.0

**GLTF Asset Pipeline (devDependencies only):**
- `@gltf-transform/cli` ^4.3.0 + `@gltf-transform/functions` ^4.3.0 — GLB optimization tooling
- `draco3dgltf` ^1.5.7 — Draco mesh compression
- `meshoptimizer` ^1.1.1 — mesh optimization
- `sharp` ^0.34.5 — image processing for assets

**Web compat:**
- `react-dom` 19.2.3
- `react-native-web` ~0.21.0

## TypeScript Setup

- Config: `tsconfig.json`, extends `expo/tsconfig.base`
- `strict: true`, `allowJs: true`, `checkJs: false`
- Path aliases: `@/*` → `./src/*`, `@/assets/*` → `./assets/*`
- Typed routes enabled (`experiments.typedRoutes: true` in `app.json`)
- React Compiler enabled (`experiments.reactCompiler: true` in `app.json`) — **WARNING: experimental feature as of Expo 56**

## Metro Bundler Config

File: `metro.config.js`

- Extends `expo/metro-config` defaults
- Adds `.glb` to `assetExts` to allow bundling GLB files
- **Blocks `assets/models/` directory** from the bundle — Filament spike GLBs (~32 MB) are explicitly excluded
- The production avatar GLBs live in `avatar-embed/avatars/` and are copied to `android-local-assets/` by the build script, not bundled via Metro

## Babel Config

File: `babel.config.js`

- Preset: `babel-preset-expo`
- Plugin: `react-native-reanimated/plugin` with `{ processNestedWorklets: true }`

## Android-Specific Configuration

**Gradle version:** 9.3.1 (`android/gradle/wrapper/gradle-wrapper.properties`)

**Build config** (`android/app/build.gradle`):
- `applicationId`: `com.mbts.botcierge`
- `minSdkVersion`: 24 (Android 7.0, confirmed via Expo module manifests)
- `targetSdkVersion`: 36
- `compileSdkVersion`: 36
- JS engine: Hermes (`hermesEnabled=true`)
- New Architecture enabled: `newArchEnabled=true` (TurboModules + Fabric renderer)
- Edge-to-edge display: `edgeToEdgeEnabled=true`
- Build architectures: `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`
- R8 minification: **disabled** by default (`enableMinifyInReleaseBuilds` not set, defaults false)
- Resource shrinking: disabled by default
- Release signing: **uses debug keystore** — not production-ready

**GIF/WebP support:** GIF enabled, WebP enabled, animated WebP disabled

**Local asset bundling (offline avatar for Android):**
- `android-local-assets/avatar-web/` is injected into Gradle asset merging via `sourceSets.main.assets.srcDirs` in `android/app/build.gradle`
- Contents: `index.html`, `app.js`, `playback-worklet.js`, `avatars/manifest.json`, `avatars/prithi.glb`, `avatars/Camilia.glb`, `backgrounds/bg1-5.jpg`
- WebView loads this as: `file:///android_asset/avatar-web/index.html`
- Rebuild command: `npm run build:avatar-embed`
- **WARNING**: The avatar GLBs are committed to the repo and in `android-local-assets/`. They must be manually regenerated and committed when avatar models change.

**Blocked Android permissions** (in `app.json`):
- `android.permission.SYSTEM_ALERT_WINDOW`
- `android.permission.RECORD_AUDIO`

## iOS-Specific Configuration

- App icon at `./assets/expo.icon` (separate from Android)
- Expo Router manages iOS navigation stack
- Avatar WebView loads from hosted Vercel URL (no local bundle for iOS — Android only gets offline embed)
- No iOS-specific native modules beyond what Expo autolinking handles
- `allowsInlineMediaPlayback` and `mediaPlaybackRequiresUserAction={false}` set on WebView for inline audio

## EAS / Build Tooling

- **No `eas.json` present** — EAS Build not configured
- **No `expo-updates`** in dependencies — no OTA updates configured
- Local build commands: `expo run:android`, `expo run:ios`
- Avatar embed build: `npm run build:avatar-embed` (must be run before Android builds)
- No CI/CD pipeline detected

## Feature Flags (Runtime)

Defined in `src/config.js`:
- `enableVoiceInput: false`
- `enableOfflineMode: true`
- `enableChatHistory: true`

## Production Readiness Flags

- Release signing uses debug keystore — **must replace before Play Store submission**
- R8/ProGuard minification disabled — **enable for production APK size reduction**
- React Compiler is experimental — monitor for regressions
- `react-native-modal` is a release candidate — watch for stability issues
- `react-native-filament` is installed but produces dead native code in the build — consider removing to reduce APK size
- No EAS Build, no OTA updates, no error tracking, no analytics

---

*Stack analysis: 2026-06-15*
