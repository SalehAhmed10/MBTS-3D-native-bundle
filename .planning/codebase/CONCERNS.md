# Codebase Concerns

**Analysis Date:** 2026-06-15
**Audit Scope:** Full codebase — build config, runtime code, assets, security, architecture, and deployment

---

## CRITICAL Issues (4)

Issues that block production release or represent immediate security/compliance risk.

---

### CRITICAL-1: No eas.json — EAS Build System Unconfigured

**Description:**
There is no `eas.json` file at the project root. Expo Application Services (EAS) requires `eas.json` to define build profiles (development, preview, production), environment variable injection, and distribution targets. Without it, `eas build` and `eas submit` cannot run.

**File/Location:** Project root — file is absent. `package.json` lists `"eas-cli"` as a dev dependency, confirming EAS is the intended build system.

**Why It Matters:**
- No production APK or IPA can be generated through EAS without a valid `eas.json`
- Environment-specific config (staging vs. production API URLs) cannot be injected per build profile
- CI/CD pipelines that call `eas build` will fail immediately
- The entire build strategy documented in the architecture is blocked

**Suggested Fix:**
Create `eas.json` at project root with at minimum three profiles:

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "MBTS_API_URL": "https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "distribution": "store",
      "env": { "MBTS_API_URL": "https://PRODUCTION_URL_HERE/" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

### CRITICAL-2: Debug Keystore Used for Release/Production Android Builds

**Description:**
`android/app/build.gradle` uses the debug keystore (`debug.keystore`) for the `release` build type signing config. The signing config block sets `storeFile file('debug.keystore')`, `storePassword "android"`, and `keyAlias "androiddebugkey"` — these are the well-known Android debug keystore defaults.

**File/Location:** `android/app/build.gradle` — `signingConfigs.release` block

**Why It Matters:**
- APKs signed with the debug keystore cannot be uploaded to the Google Play Store
- The debug keystore private key is identical on every Android developer machine worldwide — it is effectively a public key
- Any attacker can sign a malicious APK with the same keystore and potentially replace a sideloaded installation
- Play Store will reject any submission or update signed this way
- A production release signed with debug key cannot be re-signed later without a new Play Store listing

**Suggested Fix:**
1. Generate a production keystore: `keytool -genkey -v -keystore mbts-release.keystore -alias mbts -keyalg RSA -keysize 2048 -validity 10000`
2. Store it securely outside the repo (password manager or secret vault)
3. Reference it via environment variables in `build.gradle`:
```groovy
signingConfigs {
    release {
        storeFile file(System.getenv("KEYSTORE_PATH") ?: "debug.keystore")
        storePassword System.getenv("KEYSTORE_PASSWORD") ?: "android"
        keyAlias System.getenv("KEY_ALIAS") ?: "androiddebugkey"
        keyPassword System.getenv("KEY_PASSWORD") ?: "android"
    }
}
```
4. Add the production keystore path and secrets to EAS secrets or CI environment

---

### CRITICAL-3: No ios/ Directory — iOS Build Is Not Possible

**Description:**
There is no `ios/` directory in the project. For a bare Expo workflow project (which this is, given the presence of `android/` and native modules like `react-native-filament`), the `ios/` directory contains the Xcode project, `Podfile`, native module linking, and entitlements. Without it, iOS builds cannot be produced.

**File/Location:** Project root — directory is absent. `app.json` specifies `ios.bundleIdentifier: "com.mbtshome.mbtshomeapp"`, confirming iOS is a target platform.

**Why It Matters:**
- No iOS IPA can be built, tested on device, or submitted to the App Store
- React Native and Expo bare workflow require the native project to exist for any native module (Filament, RNFS, etc.) to compile
- `npx pod-install`, `xcodebuild`, and EAS iOS builds all require the `ios/` directory
- The architecture document lists iOS as a delivery target

**Suggested Fix:**
Run `npx expo prebuild --platform ios` to generate the `ios/` directory from the current `app.json` configuration. Then run `cd ios && pod install` to link native modules. Commit the generated `ios/` directory (excluding `ios/Pods/` which belongs in `.gitignore`).

---

### CRITICAL-4: No CI/CD Pipeline

**Description:**
There are no CI/CD configuration files in the repository: no `.github/workflows/`, no `bitrise.yml`, no `circle.yml`, no EAS workflow files, and no pre-commit hooks. All builds, tests, and deployments are entirely manual.

**File/Location:** Project root and `.github/` — both absent.

**Why It Matters:**
- No automated checks run on pull requests — broken builds and regressions are discovered only after manual testing
- The debug keystore issue (CRITICAL-2) and staging URL issue (HIGH-4) cannot be caught automatically
- No automated OTA update publishing on merge
- With zero test files in the project (HIGH-9), CI would at minimum enforce that the TypeScript/build compilation passes
- Deployment to client devices relies entirely on developer discipline

**Suggested Fix:**
Add a GitHub Actions workflow at `.github/workflows/ci.yml` that runs on every PR:
1. `npm install`
2. `npx tsc --noEmit` (TypeScript type check)
3. `npx expo export --platform android` (bundle compilation check)
4. On merge to main: trigger `eas update` for OTA delivery to internal track

---

## HIGH Issues (13)

Issues that significantly impact production quality, performance, or maintainability.

---

### HIGH-1: 32MB of Unused Filament GLB Models Shipped in Every APK

**Description:**
The `android/app/src/main/assets/models/` directory contains `camilia.glb` (15.9 MB) and `prithi.glb` (15.9 MB). Both files are committed to git and bundled into every APK build regardless of which avatar a user selects. Additionally, these same models are referenced from `assets/models/` at the project root, suggesting potential duplication.

**File/Location:** `android/app/src/main/assets/models/camilia.glb`, `android/app/src/main/assets/models/prithi.glb`

**Why It Matters:**
- Every user downloads and installs both 3D models even if they never use one of the avatars
- A 32MB static asset payload increases APK size, slows installs on low-bandwidth connections, and increases Play Store download times
- Google Play enforces a 150MB APK size limit; this 32MB chunk consumes a significant portion
- Asset delivery should be deferred until the user selects an avatar

**Suggested Fix:**
Use Play Asset Delivery (PAD) or Expo's asset hosting to deliver GLB files on-demand after avatar selection. At minimum, deduplicate: only one copy of each model should exist (not in both `android/app/src/main/assets/` and `assets/`). Consider hosting models on a CDN and downloading to the device cache on first use.

---

### HIGH-2: JavaScript Minification Disabled in Metro Config

**Description:**
`metro.config.js` sets `transformer: { minifierConfig: { compress: false, mangle: false } }` which disables all dead-code elimination, variable name mangling, and compression in the production JavaScript bundle.

**File/Location:** `metro.config.js` — `transformer.minifierConfig`

**Why It Matters:**
- The JS bundle shipped to users is significantly larger than necessary — typically 40-60% larger without minification
- Source code structure, variable names, and logic flow remain human-readable in the bundle
- String literals including any hardcoded URLs or config values are fully visible to anyone who extracts the APK
- This is almost certainly a development debugging leftover that was never reverted

**Suggested Fix:**
Remove the `minifierConfig` block entirely (Metro's default is minification on). If minification was disabled to debug a specific crash, re-enable it and use source maps for stack trace symbolication instead:

```js
// metro.config.js — remove or change to:
transformer: {
  // Let Metro use its defaults (minification enabled)
}
```

---

### HIGH-3: God Component — `src/app/index.tsx` is 1,334 Lines

**Description:**
`src/app/index.tsx` is a single React component handling: API calls for identity verification, multi-step authentication challenge flow, chat message state, speech synthesis orchestration, avatar selection, WebView bridge communication, session management, and all UI rendering. It is 1,334 lines long.

**File/Location:** `src/app/index.tsx` (full file)

**Why It Matters:**
- The component re-renders for every state change across all of these concerns simultaneously
- It is impossible to unit test individual behaviors in isolation (auth flow, speech trigger, chat logic)
- Any change to one concern risks breaking all others through shared state
- Adding the next feature (voice input, activity ledger, etc.) will push this file further beyond maintainability
- The legacy `Home.js` at 3,283 lines shows the pattern this codebase follows without refactoring intervention

**Suggested Fix:**
Extract into domain-specific hooks and sub-components:
- `useAuthChallenge(users, setUsers)` — multi-step identity verification state machine
- `useAvatarBridge(webViewRef)` — WebView message sending and event handling
- `useSpeech(avatarId)` — TTS trigger and speech event subscription
- `ChatScreen` — message list rendering
- `AuthFlow` — authentication UI and challenge prompts

---

### HIGH-4: Staging URLs Hardcoded as Production Fallback in `config.js`

**Description:**
`src/config.js` defaults both `MBTS_API_URL` and `AVATAR_SPEECH_API_URL` to `https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/` when `EXPO_PUBLIC_MBTS_API_URL` and `EXPO_PUBLIC_AVATAR_SPEECH_API_URL` environment variables are not set. The comment in `native-avatar-speech.tsx:310` still reads `"Calling staging TTS service..."` confirming staging is the active endpoint.

**File/Location:** `src/config.js:13-23`, `src/components/native-avatar-speech.tsx:310`

**Why It Matters:**
- Any production EAS build without env vars configured will silently point to the staging backend
- Staging databases typically contain test/dummy data; real users would interact with test data
- Staging Heroku dynos may be shut down or reset at any time
- The distinction between staging and production is invisible in app behavior — there is no runtime indication of which backend is active

**Suggested Fix:**
Change the fallback to an empty string and throw an error at startup:
```js
const MBTS_API_URL = process.env.EXPO_PUBLIC_MBTS_API_URL;
if (!MBTS_API_URL) throw new Error('EXPO_PUBLIC_MBTS_API_URL is required');
```
Use `eas.json` build profiles to inject the correct URL per environment.

---

### HIGH-5: No Error Tracking or Crash Reporting

**Description:**
No crash reporting service (Sentry, Crashlytics, Bugsnag, Datadog) is installed or configured. Unhandled exceptions, native crashes, TTS failures, and WebView errors produce no alerts.

**File/Location:** `package.json` — no `@sentry/react-native`, `@react-native-firebase/crashlytics`, or equivalent dependency exists.

**Why It Matters:**
- Production crashes are invisible — the team learns about them only if a user reports them
- The Filament 3D renderer, WebView bridge, and Heroku TTS endpoint are all high-risk failure points with no observability
- TTS cold-start timeouts (see FRAGILE-2 in previous audit) will silently fail for users with no log trail
- Without error rates, it is impossible to prioritize fixes or know if a release made things worse

**Suggested Fix:**
Install `@sentry/react-native` and initialize in `src/app/_layout.tsx`:
```bash
npx expo install @sentry/react-native
```
Configure with a DSN from sentry.io. Wrap the app root with `Sentry.wrap(App)`. Add `captureException` in catch blocks throughout `index.tsx` and `native-avatar-speech.tsx`.

---

### HIGH-6: No Error Boundary at App Root

**Description:**
There is no React `ErrorBoundary` component wrapping the app. An unhandled render error in `FilamentPreview`, `AvatarWebView`, or any child component will crash the entire app with a red screen in development or a blank white screen in production, with no recovery path.

**File/Location:** `src/app/_layout.tsx` — no ErrorBoundary component present or imported.

**Why It Matters:**
- The Filament 3D renderer is the highest-risk component: a GLB loading failure or native bridge error that propagates to the render function crashes the full app
- Users on first launch who encounter a Filament crash have no way to continue using any other app feature
- React error boundaries are a standard React pattern and are trivial to add

**Suggested Fix:**
Add an `ErrorBoundary` wrapper in `src/app/_layout.tsx`:
```tsx
class AppErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { /* log to Sentry */ }
  render() {
    if (this.state.hasError) return <ErrorScreen />;
    return this.props.children;
  }
}
```

---

### HIGH-7: No Tests — Zero Test Files in the Entire Project

**Description:**
There are no test files anywhere in the repository. No unit tests, no integration tests, no snapshot tests. `package.json` has `"jest"` as a dev dependency with an Expo preset configured, but `__tests__/` directories and `*.test.*` files are entirely absent.

**File/Location:** All `src/` — no `*.test.ts`, `*.test.tsx`, `*.spec.*`, or `__tests__/` exist.

**Why It Matters:**
- The authentication challenge flow (`src/app/index.tsx:368-615`) is complex multi-step state logic with no test coverage — regressions are invisible
- Viseme timing computation (`native-avatar-speech.tsx:377-759`) involves precise millisecond-level scheduling that is extremely hard to validate manually
- The avatar bridge message format (`avatarBridge.js`) is a serialization contract with the WebView — malformed messages fail silently
- Any refactoring of the God Component (HIGH-3) or the legacy `Home.js` is unvalidated

**Suggested Fix:**
Start with the highest-risk, most testable units:
1. `src/components/avatar/avatarBridge.js` — pure functions, easy to test
2. `src/app/index.tsx` auth challenge reducer logic — extract to pure function first
3. `src/components/native-avatar-speech.tsx` — viseme scheduler timing with fake timers

---

### HIGH-8: `allowUniversalAccessFromFileURLs` Enabled in WebView

**Description:**
`AvatarWebView.js` sets `allowUniversalAccessFromFileURLs={true}` and `allowFileAccessFromFileURLs={true}` on the React Native WebView. These settings allow JavaScript in the WebView to make cross-origin `fetch()` and `XMLHttpRequest` calls to any URL from a `file://` origin, bypassing the same-origin policy.

**File/Location:** `src/components/avatar/AvatarWebView.js:279-287`

**Why It Matters:**
- If the WebView ever loads malicious or compromised content (XSS in the avatar page, DNS hijack), that content can exfiltrate data to any server
- On Android, `allowFileAccessFromFileURLs` allows the WebView to read arbitrary files from the device filesystem if a `file://` URL is constructed
- These settings were added to support the `file:///android_asset/` local bundle path, but `allowUniversalAccessFromFileURLs` is broader than necessary for that use case

**Suggested Fix:**
- Keep `allowFileAccessFromFileURLs={true}` only for the Android local asset path (required for `file:///android_asset/`)
- Remove `allowUniversalAccessFromFileURLs={true}` — it is not needed if the avatar page only communicates via `postMessage`
- Restrict `originWhitelist` from `['*']` to `['https://mbts-3-d-native-bundle.vercel.app', 'file://*']`

---

### HIGH-9: No Retry Logic on Any API Calls

**Description:**
All `fetch()` calls in `src/app/index.tsx` and `src/screens/Home.js` are single-attempt with no retry, no exponential backoff, and no timeout configuration. The Heroku TTS endpoint is known to have 10-30 second cold starts.

**File/Location:** `src/app/index.tsx:369-387` (verifyPerson), `src/app/index.tsx:415-435` (getPersonDetails), `src/components/native-avatar-speech.tsx:168-187` (TTS request), `src/screens/Home.js` (all fetch calls)

**Why It Matters:**
- A single transient network error or Heroku cold-start timeout permanently fails the operation from the user's perspective
- The TTS warmup health check (`SPEECH_HEALTH_ENDPOINT`) runs once at startup but does not guarantee the dyno stays warm during the session
- The auth flow fails permanently on network error with no user-visible retry option

**Suggested Fix:**
Add a minimal retry wrapper:
```ts
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try { return await fetch(url, options); }
    catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
}
```
Apply to all TTS and auth API calls. Add a 30-second `AbortController` timeout.

---

### HIGH-10: `LogBox.ignoreAllLogs()` Silences All Runtime Warnings

**Description:**
`src/app/_layout.tsx:8` calls `LogBox.ignoreAllLogs()` which suppresses every React Native warning and error in the LogBox UI — including deprecation warnings, prop type errors, unmounted component state updates, and potential security notices from third-party libraries.

**File/Location:** `src/app/_layout.tsx:8`

**Why It Matters:**
- Warnings from `react-native-filament`, `react-native-webview`, and `react-native-reanimated` that indicate real problems are silently swallowed during development
- Developers working on the app receive no visual feedback about component lifecycle issues or API misuse
- This is a debugging shortcut that was left in and should not exist in any branch that will be built for production

**Suggested Fix:**
Remove the `LogBox.ignoreAllLogs()` call. Address individual warnings by category using `LogBox.ignoreLogs([...specific patterns...])` only for known safe warnings (e.g., third-party library warnings that are confirmed harmless).

---

### HIGH-11: No Authentication Headers on API Requests

**Description:**
All `fetch()` calls across `src/app/index.tsx` and `src/screens/Home.js` send requests with only `Content-Type: application/json` headers. There are no JWT tokens, API keys, Bearer tokens, or session cookies. Identity is communicated by passing a user `_id` in the request body.

**File/Location:** `src/app/index.tsx:369-387`, `src/screens/Home.js` (all fetch calls)

**Why It Matters:**
- Any request to the MBTS API can be replayed by anyone who knows the endpoint structure and a valid `_id`
- The `verifyPerson` flow relies entirely on the backend trusting the client-supplied `_id` without a shared secret
- Without auth headers, there is no server-side session revocation mechanism

**Suggested Fix:**
After successful identity verification, the backend should issue a signed JWT. All subsequent requests should include `Authorization: Bearer <token>`. The token should be stored in `SecureStore` (not `AsyncStorage`) and refreshed on expiry.

---

### HIGH-12: User Identity Verified by Self-Reported `_id`

**Description:**
The `verifyPerson` function in `src/app/index.tsx` posts a `_id` value supplied by the device to the backend to retrieve a person record and begin authentication. The `_id` is selected from a list of candidates based on self-reported intent data — there is no cryptographic proof of identity at this step.

**File/Location:** `src/app/index.tsx:368-398`

**Why It Matters:**
- If an attacker can enumerate or guess valid MongoDB `_id` values, they can initiate the auth challenge for any user
- The auth challenge questions (presumably knowledge-based) are the only real barrier — and their answers may be obtainable through social engineering
- There is no rate limiting, CAPTCHA, or lockout visible on the client side

**Suggested Fix:**
The `_id` lookup should require a pre-shared device token or phone number verification (OTP via SMS/email) before returning any user record. This is a backend change, but the client should be designed to handle and enforce the stricter flow.

---

### HIGH-13: Android Local Asset Bundle Committed to Git

**Description:**
`android/app/src/main/assets/avatar-web/` contains the full compiled avatar web bundle (HTML, JS, CSS) committed directly to the git repository. This is generated output from a separate build process, not source.

**File/Location:** `android/app/src/main/assets/avatar-web/` directory

**Why It Matters:**
- The committed bundle may be stale relative to the source in the separate `mbts-3d-native-bundle` Vercel repo
- Developers can accidentally ship an outdated avatar bundle in an Android build by not re-generating it before building
- Binary/minified JS files in git produce large, unreadable diffs and bloat repository size
- There is no documented process for when and how to update this bundle before a release

**Suggested Fix:**
Add a pre-build script (`"prebuild": "node scripts/fetch-avatar-bundle.js"`) that downloads the latest bundle from the Vercel deployment or builds it from source. Add `android/app/src/main/assets/avatar-web/` to `.gitignore`. Document the bundle update process in the build runbook.

---

## MEDIUM Issues (9)

Issues that reduce production quality but do not block release.

---

### MEDIUM-1: OTA Updates Disabled in App Config

**Description:**
`app.json` sets `"updates": { "enabled": false }` which disables Expo's over-the-air JavaScript update mechanism entirely. OTA updates allow bug fixes and content changes to be pushed to users without a full App Store/Play Store release cycle.

**File/Location:** `app.json` — `expo.updates.enabled: false`

**Why It Matters:**
- Any bug fix to JavaScript code (which is the majority of the app) requires a full App Store/Play Store submission and 1-7 day review cycle
- The architecture document lists OTA as a delivery mechanism — having it disabled contradicts the intended deployment strategy
- For a care/support-oriented app, rapid fix delivery is especially important

**Suggested Fix:**
Enable OTA updates and configure an update URL:
```json
"updates": {
  "enabled": true,
  "fallbackToCacheTimeout": 0,
  "url": "https://u.expo.dev/YOUR-PROJECT-ID"
}
```
Set `checkAutomatically: "ON_LOAD"` and use `eas update` to publish OTA updates on non-native changes.

---

### MEDIUM-2: iOS Privacy Manifest Missing

**Description:**
Apple requires a `PrivacyInfo.xcprivacy` file in iOS app bundles as of iOS 17 / Xcode 15 (enforced for App Store submissions since May 2024). This file must declare all privacy-sensitive API usage (file system access, user defaults, device signals). The `ios/` directory does not exist (CRITICAL-3), so this manifest cannot exist either.

**File/Location:** `ios/MBTS3D/PrivacyInfo.xcprivacy` — file would be located here once `ios/` is generated.

**Why It Matters:**
- App Store submissions without a valid privacy manifest are rejected automatically
- The app uses `react-native-fs` (file system), `AsyncStorage` (user defaults), and device motion APIs — all of which require declaration
- Fixing this after `ios/` generation is trivial but must not be forgotten before first TestFlight submission

**Suggested Fix:**
After running `npx expo prebuild --platform ios`, add `ios/MBTS3D/PrivacyInfo.xcprivacy` declaring:
- `NSPrivacyAccessedAPICategoryFileTimestamp` (for RNFS)
- `NSPrivacyAccessedAPICategoryUserDefaults` (for AsyncStorage)
Reference Apple's required reason API documentation for the correct usage reason codes.

---

### MEDIUM-3: TTS Cache Not Implemented for Repeat Utterances

**Description:**
`native-avatar-speech.tsx` has a file-system cache skeleton (`getCachedAudioPath`, `cacheTTSAudio`) using a SHA-256 hash of the text. However, the cache is only checked in `speak()` and only populated after a fresh API call. Identical phrases spoken in the same session make duplicate API calls because the cache check uses a file existence test that may miss in-flight requests.

**File/Location:** `src/components/native-avatar-speech.tsx:105-143`, `src/components/native-avatar-speech.tsx:168-210`

**Why It Matters:**
- Common phrases ("Hello, how can I help you?", greeting sequences) trigger a fresh Heroku TTS call every time they are spoken, even within the same app session
- Each TTS call costs latency (300ms-2s minimum) and backend compute
- On the Heroku staging dyno, repeated calls for the same phrase are all cache misses at the API level

**Suggested Fix:**
Add an in-memory `Map<string, Promise<string>>` cache as a request deduplicator:
```ts
const inFlightCache = new Map<string, Promise<string>>();
// In speak(): check inFlightCache before making a fetch, store the promise, resolve to file path
```
Pre-warm the cache at app startup with common greeting phrases using `prefetchCommonPhrases()`.

---

### MEDIUM-4: Duplicate `react-native-worklets-core` Package Versions

**Description:**
`package.json` lists both `react-native-worklets-core` as a direct dependency and `react-native-reanimated` which bundles its own worklets runtime. This creates a risk of two incompatible worklets runtimes being initialized, causing silent failures or crashes in worklet-dependent code.

**File/Location:** `package.json` — `dependencies` section

**Why It Matters:**
- `react-native-filament` requires `react-native-worklets-core` at a specific version
- `react-native-reanimated` v3+ includes its own worklets core and may conflict if versions are mismatched
- Worklets runtime conflicts manifest as cryptic native crashes that are hard to attribute to a version mismatch

**Suggested Fix:**
Check the exact versions with `npm ls react-native-worklets-core`. If `react-native-reanimated` and `react-native-filament` require different versions, use the `resolutions` field in `package.json` to pin to a compatible shared version. Verify with the `react-native-filament` compatibility matrix.

---

### MEDIUM-5: 88 `console.log` Statements Will Reach Production

**Description:**
A search across `src/` reveals approximately 88 `console.log`, `console.warn`, and `console.error` calls that are not wrapped in any development guard. These fire on every affected code path in production builds.

**File/Location:** Throughout `src/screens/Home.js` (majority), `src/app/index.tsx`, `src/components/native-avatar-speech.tsx`, `src/components/avatar/AvatarWebView.js`

**Why It Matters:**
- Console logging in production leaks internal state, API responses, and user data to anyone with device log access (e.g., via `adb logcat` on Android)
- On low-end Android devices, excessive logging noticeably impacts performance
- Two `console.log` calls in `Home.js:551-553` fire on every render (not just once), compounding the impact
- `person` and `person1` objects logged on every render include user identity data

**Suggested Fix:**
Replace all `console.log` with a conditional logger:
```ts
const log = __DEV__ ? console.log : () => {};
```
Or install `react-native-logs` with a production-silent transport. Remove the unconditional render-body logs in `Home.js:551-553` entirely.

---

### MEDIUM-6: No Loading or Error State for Filament 3D Avatar

**Description:**
`src/components/filament-preview.tsx` returns `null` if the GLB model state is not `"loaded"`. There is no loading spinner, progress indicator, or error message — the avatar viewport is simply blank during load and permanently blank on failure.

**File/Location:** `src/components/filament-preview.tsx:69-99` — `if (model.state !== 'loaded') return null`

**Why It Matters:**
- Users see a blank space where the avatar should be for 1-5 seconds on every launch
- If the GLB file is missing, corrupt, or incompatible, the blank space is permanent with no diagnostic feedback
- `useModel` from `react-native-filament` exposes `model.state` values including `"error"` which is never handled

**Suggested Fix:**
```tsx
if (model.state === 'error') return <AvatarErrorFallback />;
if (model.state !== 'loaded') return <AvatarLoadingSpinner />;
```
Add a fallback 2D avatar image to `AvatarErrorFallback` so the app remains functional even when 3D fails.

---

### MEDIUM-7: No WebView Loading State During Avatar Panel Initialization

**Description:**
During the 1-3 second WebView initialization period, the avatar chat panel is entirely blank. `AvatarWebView.js` has no loading indicator shown while `resolvedSourceUrl` resolves or while the WebView page loads.

**File/Location:** `src/components/avatar/AvatarWebView.js:295-308`, `src/components/avatar/AvatarWebView.js:347-349`

**Why It Matters:**
- First-time users see a blank panel and may assume the app is broken
- The Android path has an extra async step (`resolvedSourceUrl` starts as `null`) making the blank period longer
- No visual continuity between the 3D avatar (Filament) and the WebView avatar panel

**Suggested Fix:**
Add `startInLoadingState={true}` and `renderLoading={() => <ActivityIndicator />}` to the WebView component. Show a skeleton placeholder matching the avatar panel dimensions while `resolvedSourceUrl === null`.

---

### MEDIUM-8: Auth Flow Race Condition in Multi-Step Challenge

**Description:**
The multi-step authentication challenge in `src/app/index.tsx` accumulates and filters the `users` state array across async steps. `setUsers(filtered)` and `askNextAuthQuestion()` are called sequentially without awaiting React's state flush, creating a potential race between the filtered state being available and the next question being rendered.

**File/Location:** `src/app/index.tsx:400-466`

**Why It Matters:**
- If `askNextAuthQuestion` reads `users` from a stale closure before `setUsers` takes effect, the challenge may present wrong or duplicate candidates
- React batches state updates in event handlers but not always across async boundaries
- The bug would manifest as the wrong challenge question or an incorrect "no match found" result

**Suggested Fix:**
Move the auth challenge logic to a `useReducer` with explicit state transitions:
```ts
type AuthState = { candidates: User[]; step: number; status: 'pending' | 'verified' | 'failed' };
type AuthAction = { type: 'FILTER'; by: keyof User; value: string } | { type: 'ADVANCE' } | ...;
const [authState, dispatch] = useReducer(authReducer, initialState);
```
State transitions in a reducer are synchronous and testable.

---

### MEDIUM-9: CMake/C++ Build Artifacts Committed to Git

**Description:**
The `android/app/.cxx/` directory contains CMake build cache artifacts generated during native compilation. These are platform-specific, machine-specific binary outputs that should never be in version control.

**File/Location:** `android/app/.cxx/` directory

**Why It Matters:**
- These files bloat the repository with binary content that is regenerated on every build
- Files compiled on one machine (e.g., macOS ARM) may conflict with those compiled on another (Windows x86)
- `.cxx/` artifacts can cause confusing build failures on fresh checkouts when the cached state conflicts with the current toolchain version
- Git history permanently stores these large binaries even after they are removed

**Suggested Fix:**
Add to `.gitignore`:
```
android/app/.cxx/
android/.gradle/
```
Then remove from git history: `git rm -r --cached android/app/.cxx/` and commit the removal.

---

## LOW Issues (4)

Minor issues that should be addressed in routine maintenance.

---

### LOW-1: `isMounted` Ref Set But Never Read in AvatarWebView

**Description:**
`AvatarWebView.js:237-258` declares `let isMounted = true` inside a `useEffect` closure and sets it to `false` in the cleanup function. However, `isMounted` is never checked inside any async callback within that effect, making it a no-op guard.

**File/Location:** `src/components/avatar/AvatarWebView.js:237-258`

**Why It Matters:**
- Provides false assurance that unmounted component updates are guarded
- Any async code added to this effect in the future will not actually be protected

**Suggested Fix:**
Either remove `isMounted` if the effect has no async operations that need guarding, or wrap all async state updates with `if (isMounted)` checks.

---

### LOW-2: `buildAvatarBridgeMessage` is a Pass-Through No-Op

**Description:**
`src/components/avatar/avatarBridge.js:49-51` defines `buildAvatarBridgeMessage = payload => ({ ...payload })` — a spread that does no transformation, validation, or normalization.

**File/Location:** `src/components/avatar/avatarBridge.js:49-51`

**Why It Matters:**
- Named function implies message construction logic exists; callers may trust it validates the payload
- Malformed payloads pass through unchanged to `injectJavaScript`, which fails silently in the WebView

**Suggested Fix:**
Either implement actual validation (required fields check, type coercion) or rename it to `passthrough` and add a comment, or remove the function and spread inline at the call site.

---

### LOW-3: `src/data/avatars.js` Lists 12 Avatars But Only 2 Are 3D-Capable

**Description:**
The avatar catalog lists Camilia, Benjamin, Dan, Candy, and 8 others. The 3D rendering system (`filament-preview.tsx`, `avatarBridge.js`) only supports `"prithi"` and `"camilia"`. Selecting any other avatar silently falls through to a default.

**File/Location:** `src/data/avatars.js`, `src/components/filament-preview.tsx:15`, `src/components/avatar/avatarBridge.js:3-7`

**Why It Matters:**
- Users who select Benjamin or Dan see no error but also see no behavioral difference — confusing UX
- The avatar selection screen implies a richer feature than what is implemented

**Suggested Fix:**
Add a `supported3D: boolean` field to each avatar entry. In the avatar selection UI, visually disable or badge unsupported avatars as "Coming soon" rather than allowing silent fallback.

---

### LOW-4: Voice Input Feature Flag Exists But Feature is Unimplemented

**Description:**
`src/config.js:41` has `enableVoiceInput: false`. The feature flag mechanism is wired but the voice input feature itself has no implementation.

**File/Location:** `src/config.js:41`

**Why It Matters:**
- Low risk currently since the flag is off, but the flag creates the impression that toggling it to `true` would enable something — it would not
- Any developer who sets it to `true` expecting behavior will be confused by the silence

**Suggested Fix:**
Either remove the flag until the feature is ready to implement, or add a comment: `// enableVoiceInput: placeholder — not yet implemented; see backlog item #XX`.

---

## Summary Table

| ID | Severity | Title | File(s) |
|----|----------|-------|---------|
| CRITICAL-1 | CRITICAL | No eas.json — EAS build unconfigured | Project root |
| CRITICAL-2 | CRITICAL | Debug keystore on release builds | `android/app/build.gradle` |
| CRITICAL-3 | CRITICAL | No ios/ directory | Project root |
| CRITICAL-4 | CRITICAL | No CI/CD pipeline | Project root |
| HIGH-1 | HIGH | 32MB unused Filament GLBs in APK | `android/app/src/main/assets/models/` |
| HIGH-2 | HIGH | Minification disabled in Metro config | `metro.config.js` |
| HIGH-3 | HIGH | God Component — 1,334 lines | `src/app/index.tsx` |
| HIGH-4 | HIGH | Staging URLs as production fallback | `src/config.js` |
| HIGH-5 | HIGH | No error tracking / crash reporting | `package.json` |
| HIGH-6 | HIGH | No error boundary at app root | `src/app/_layout.tsx` |
| HIGH-7 | HIGH | Zero test files in the project | All `src/` |
| HIGH-8 | HIGH | allowUniversalAccessFromFileURLs enabled | `src/components/avatar/AvatarWebView.js` |
| HIGH-9 | HIGH | No retry logic on API calls | `src/app/index.tsx`, `native-avatar-speech.tsx` |
| HIGH-10 | HIGH | LogBox.ignoreAllLogs() in layout | `src/app/_layout.tsx` |
| HIGH-11 | HIGH | No auth headers on API requests | `src/app/index.tsx`, `Home.js` |
| HIGH-12 | HIGH | Identity verified by self-reported _id | `src/app/index.tsx` |
| HIGH-13 | HIGH | Android local asset bundle committed to git | `android/app/src/main/assets/avatar-web/` |
| MEDIUM-1 | MEDIUM | OTA updates disabled | `app.json` |
| MEDIUM-2 | MEDIUM | iOS privacy manifest missing | `ios/` (absent) |
| MEDIUM-3 | MEDIUM | TTS cache not implemented for repeats | `native-avatar-speech.tsx` |
| MEDIUM-4 | MEDIUM | Duplicate worklets-core packages | `package.json` |
| MEDIUM-5 | MEDIUM | 88 console.logs in production | Throughout `src/` |
| MEDIUM-6 | MEDIUM | No loading/error state for Filament avatar | `filament-preview.tsx` |
| MEDIUM-7 | MEDIUM | No WebView loading state | `AvatarWebView.js` |
| MEDIUM-8 | MEDIUM | Auth flow race condition | `src/app/index.tsx` |
| MEDIUM-9 | MEDIUM | CMake artifacts committed to git | `android/app/.cxx/` |
| LOW-1 | LOW | isMounted ref never read | `AvatarWebView.js` |
| LOW-2 | LOW | buildAvatarBridgeMessage is a no-op | `avatarBridge.js` |
| LOW-3 | LOW | 12 avatars listed, only 2 are 3D-capable | `src/data/avatars.js` |
| LOW-4 | LOW | Voice input flag with no implementation | `src/config.js` |

---

*Concerns audit: 2026-06-15 — 4 CRITICAL, 13 HIGH, 9 MEDIUM, 4 LOW*
