# External Integrations

**Analysis Date:** 2026-06-15

## APIs & External Services

**Main MBTS Backend (Heroku):**
- Purpose: Business logic — user profiles, requests, intents, activity ledger, xshare/bids, shopping lists, schedules, SMS
- Host (env): `EXPO_PUBLIC_MBTS_API_URL` (default: `https://mbts.herokuapp.com/`)
- Config: `src/config.js` exports `MBTS_API_URL`; consumed via `src/utils/api.js` as `baseURL`
- Client: native `fetch` + `axios` (mixed usage)
- Auth: bearer token passed in `Authorization` header on requests (token stored in Redux/MMKV)
- Key endpoints called from `src/app/index.tsx`, `src/screens/Home.js`, `src/redux/slices/xShareSlice.js`:
  - `POST users/getPersonById`
  - `POST requests/requestHandler`
  - `POST intents/intentHandler`
  - `GET/POST xshare`, `GET xshares/:userId`
  - `POST bids/create-bid`, `GET bids/need/:needId`, `POST bids/accept/:bidId`
  - `POST requests/updateTodoFulfillment`
  - `POST requests/updateShoppingList`, `POST requests/addItemsToShoppingList`, `POST requests/UpdateShoppingListFulfillment`
  - `POST requests/updateTodoList`
  - `POST requests/updateSchedule`
  - `POST requests/updatePackages`
  - `POST activityLedger/createOrUpdate`
  - `POST services/send-sms`
  - `GET/POST xshares/need-type`

**Avatar Speech Backend (Heroku staging):**
- Purpose: TTS synthesis — converts text to audio + viseme/lip-sync data for the avatar
- Host (env): `EXPO_PUBLIC_AVATAR_SPEECH_API_URL` (default: `https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/`)
- Config: `src/config.js` exports `AVATAR_SPEECH_API_URL`, `SPEECH_SYNTHESIS_ENDPOINT`, `SPEECH_HEALTH_ENDPOINT`
- Client: native `fetch`
- Key endpoints:
  - `POST avatarSpeech/synthesize` — takes `{ text, avatarId, voiceId }`, returns `{ audioBase64, words, wordTimes, wordDurations, visemes, visemeTimes, visemeDurations }`
  - `GET avatarSpeech/health` — health/warmup endpoint; called on app mount from `src/app/_layout.tsx` to warm the Heroku dyno
- **WARNING**: Both the main API and avatar speech API default to the same staging Heroku URL in `src/config.js` fallback, but `EXPO_PUBLIC_MBTS_API_URL` in `.env.example` points to `https://mbts.herokuapp.com/` (separate host). Verify env separation for production.
- **WARNING**: Heroku free dynos cold-start; the health ping on mount is a workaround for this latency, not a permanent fix.

## Data Storage

**Databases:**
- No direct database connection from the app — all data access is via the MBTS backend REST API

**Local Persistent Storage:**
- MMKV via `react-native-mmkv-storage` ^12.0.1
- Used as the redux-persist storage adapter (`src/redux/storage/`)
- Stores persisted Redux state (user session, slices defined in `src/redux/slices/`)

**TTS Speech Cache (local filesystem):**
- Implementation: `src/utils/speechCache.ts`
- Uses `expo-file-system` (`File`, `Paths.cache` API)
- Cache key: hash of `text|avatarId|voiceId` — stores synthesized audio+viseme payloads as JSON
- Cache prefix: `tts-v1`
- Purpose: avoids re-synthesizing repeated speech utterances; reduces backend calls and latency

**File Storage:**
- Local filesystem only (via `expo-file-system`) for TTS cache
- No cloud file storage (S3, GCS, etc.) detected

**Caching:**
- TTS speech: local filesystem (see above)
- Avatar manifest: loaded with `cache: "force-cache"` in `avatar-embed/src/main.js`
- No HTTP-level cache layer detected

## Avatar / 3D AI Service

**Custom TalkingHead (self-hosted, not a third-party SaaS):**
- Engine: `TalkingHead` from `avatar-embed/modules/talkinghead.mjs`
- Renders animated GLB avatars with morph targets, lip-sync, and emotion/mood states
- Driven by audio + viseme data delivered from the Avatar Speech Backend
- **Not HeyGen, not D-ID** — this is a locally-embedded Three.js + custom animation library
- GLB models committed to repo: `avatar-embed/avatars/prithi.glb` (8.6 MB), `avatar-embed/avatars/Camilia.glb` (2.7 MB)
- Avatar registry defined in `avatar-embed/avatars/manifest.json`

**Speech Mode (production):**
- Mode: `service` (see `src/components/avatar/speechProvider.js`)
- Flow: app sends text to `avatarSpeech/synthesize` → receives base64 audio + viseme timing → passes to WebView via `speakAudio` message → TalkingHead plays lip-synced audio
- No HeyGen/D-ID real-time streaming; all synthesis is request-response

## Voice / TTS Integration

**Avatar Speech Backend (Heroku):**
- The MBTS avatar speech backend wraps an underlying TTS service (implementation on backend, not visible from client)
- Client interface: `POST avatarSpeech/synthesize` with `{ text, avatarId, voiceId }`
- Voices are defined per-avatar in `avatar-embed/avatars/manifest.json`; current avatars each have one default voice (`prithi-default`, `camilia-default`)
- No third-party TTS SDK is installed in the React Native app itself

**Audio Playback:**
- `expo-audio` ~56.0.11 — used for audio playback in the native layer
- Microphone permission disabled in `app.json` (`recordAudioAndroid: false`, `microphonePermission: false`)
- Audio playback in the WebView uses the Web Audio API (`AudioContext`, `AudioWorkletNode` via `avatar-embed/playback-worklet.js`)

## Avatar WebView Bridge

**Protocol:** postMessage bidirectional JSON bridge

**React Native → WebView (commands):**
- `setAvatar` — swap displayed avatar
- `setMood` — change emotion state
- `setBackground` — change background image
- `speakAudio` — play audio with viseme lip-sync
- `displayText` — display subtitle text

**WebView → React Native (events):**
- `avatar_ready` — 3D scene loaded, speech can begin
- `speech_started` — audio playback began
- `speech_finished` — audio playback complete
- `avatar_error` — rendering or playback failure

**Implementation:** `src/components/avatar/AvatarWebView.js`, `src/components/avatar/avatarBridge.js`

## Avatar WebView Delivery

**Android (offline-first):**
- URL: `file:///android_asset/avatar-web/index.html`
- Source: `android-local-assets/avatar-web/` (injected via `sourceSets.main.assets.srcDirs`)
- Built by: `npm run build:avatar-embed` → copies from `avatar-embed/` to `android-local-assets/avatar-web/`
- Fetch polyfill in `avatar-embed/index.html` handles `file://` URI access (Android WebView blocks native `fetch` for `file://`)

**iOS / Web (hosted):**
- URL: `EXPO_PUBLIC_AVATAR_WEB_VIEW_URL` (default: `https://mbts3d-avatar.vercel.app/` in `.env.example`, `https://mbts-3-d-native-bundle.vercel.app/` in `src/config.js` fallback)
- **WARNING**: `.env.example` and the hardcoded fallback in `src/config.js` point to different Vercel URLs — reconcile before production iOS build

## CDN / Asset Delivery

**Vercel:**
- Hosts the avatar embed web page for iOS and development
- URL configured via `EXPO_PUBLIC_AVATAR_WEB_VIEW_URL`
- Static deployment of `avatar-embed/` folder

**No CDN for app assets detected:**
- Android avatar GLBs are bundled locally into the APK via `android-local-assets/`
- No S3, CloudFront, or similar for model delivery

## WebSocket / Real-time Connections

- None detected. All communication is HTTP request-response (fetch + axios).
- No socket.io, WebSocket, SSE, or polling mechanisms found in `src/`.

## Authentication & Identity

**Auth Provider:** Custom backend auth (MBTS backend)
- No third-party auth SDK installed (no Supabase, Auth0, Firebase Auth, Clerk, etc.)
- Auth token stored in Redux state and persisted to MMKV
- Passed as `Authorization: Bearer <token>` in API requests
- Implementation: scattered across `src/app/index.tsx` and `src/screens/Home.js`

## Monitoring & Observability

**Error Tracking:** None — no Sentry, Bugsnag, Datadog, or similar installed
**Analytics:** None — no Amplitude, Mixpanel, Firebase Analytics, Segment, or similar installed
**Logging:** `console.log` only; all logs silenced in the app via `LogBox.ignoreAllLogs()` in `src/app/_layout.tsx`
**Performance Monitoring:** None

**WARNING**: `LogBox.ignoreAllLogs()` suppresses all warnings including critical ones. Remove before production.

## CI/CD & Deployment

**Hosting:**
- Android: local builds via `expo run:android`; no EAS, no Play Store pipeline configured
- iOS: local builds via `expo run:ios`; no TestFlight/App Store pipeline configured
- Avatar embed: Vercel (static site deployment of `avatar-embed/`)

**CI Pipeline:** None detected (no `.github/workflows/`, no CircleCI, no Bitrise config)

**EAS Build:** Not configured — no `eas.json`

**OTA Updates:** Not configured — `expo-updates` not installed

## SMS Integration

- MBTS backend exposes `POST services/send-sms` endpoint
- Called from `src/screens/Home.js`
- SMS provider implementation is on the backend (Twilio or similar); not visible from client

## Environment Configuration

**Required environment variables (from `.env.example`):**
- `EXPO_PUBLIC_MBTS_API_URL` — main backend base URL (e.g., `https://mbts.herokuapp.com/`)
- `EXPO_PUBLIC_AVATAR_SPEECH_API_URL` — avatar TTS backend base URL (e.g., `https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/`)
- `EXPO_PUBLIC_AVATAR_WEB_VIEW_URL` — hosted avatar WebView URL for iOS/dev (e.g., `https://mbts3d-avatar.vercel.app/`)

**Secrets location:**
- `.env` file (present, not committed — listed in `.gitignore`)
- No secrets manager detected

**Config resolution:**
- All env vars are read in `src/config.js` with hardcoded fallbacks
- The `EXPO_PUBLIC_` prefix makes vars available client-side via Expo's `process.env` injection

## Webhooks & Callbacks

**Incoming:** None detected
**Outgoing:** None detected (no webhook dispatch in client code)

---

*Integration audit: 2026-06-15*
