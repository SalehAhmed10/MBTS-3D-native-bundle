# MBTS 3D — Architecture & Flow

**Package:** `com.mbts.botcierge`  
**App name:** MBTS 3D  
**Stack:** React Native (Expo SDK 56) + WebView + Three.js/TalkingHead + Heroku backend

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   MBTS 3D Android APK                   │
│                                                         │
│  ┌──────────────────┐    ┌────────────────────────────┐ │
│  │   React Native   │    │  Android WebView           │ │
│  │   (Expo Router)  │    │                            │ │
│  │                  │◄──►│  avatar-embed/index.html   │ │
│  │  index.tsx       │    │  app.js (Three.js +        │ │
│  │  _layout.tsx     │    │  TalkingHead, 1.8MB)       │ │
│  │  speechCache.ts  │    │  prithi.glb   (8.6MB)      │ │
│  │                  │    │  Camilia.glb  (2.7MB)      │ │
│  └──────────────────┘    │  backgrounds/bg1-5.jpg     │ │
│                           └────────────────────────────┘ │
│                           All loaded from android_asset/ │
│                           (bundled in APK, no network)   │
└─────────────────────────────────────────────────────────┘
         │                              │
         │ POST /avatarSpeech/synthesize│ (cache miss only)
         ▼                              │
┌─────────────────┐                     │ WebView sends
│  Heroku Backend │                     │ avatar_ready,
│  (basic dyno,   │◄────────────────────┘ speech_started,
│  no cold starts)│                       speech_finished
│                 │
│  /avatarSpeech  │ → returns audioBase64 + visemes + wordTimes
│  /mbts API      │ → returns intent/response text
└─────────────────┘
```

---

## Fresh Install — Step by Step

### 1. App Launch
- `_layout.tsx` mounts immediately
- Fires `GET /health` to Heroku (warmup, fire-and-forget) so the dyno is hot before first TTS request
- `AnimatedSplashOverlay` shows during JS bundle load (~1.8s)

### 2. HomeScreen Mounts (index.tsx)
- `speechQueue` initialised with `{ id: "hello", text: "Hello, I'm Prithi. What's your name? Please enter it below." }`
- `AvatarWebView` mounts → WebView starts loading `file:///android_asset/avatar-web/index.html?speechMode=service&embed=1`

### 3. WebView Load (local, from APK)
```
T+0ms    webview_load_start
T+13ms   webview_load_end  (HTML + app.js parsed from android_asset/, OS-cached after first run)
T+1300ms avatar_ready      (Three.js init + GLB decode complete)
```
On first-ever cold run: HTML parse ~400ms, avatar_ready ~2600ms (disk cold). After first run OS caches the WebView → 13ms parse consistently.

### 4. TTS Fetch / Cache Check
When `avatar_ready` fires, the pending `speakAudio` message is flushed from the queue.

**Cache hit (all runs after first):**
```
getCachedSpeech("Hello, I'm Prithi...", "prithi", "prithi-default")
  → reads tts-v1-<hash>.json from FileSystem.cacheDirectory
  → returns { audioBase64, visemes, wordTimes, ... }
  → inject to WebView immediately
  → speech_started ~800ms after avatar_ready
```

**Cache miss (first install only):**
```
POST https://[heroku]/avatarSpeech/synthesize
  body: { text, avatar, mood, voiceId }
  → ~800ms response (Heroku already warm from step 1)
  → cacheSpeech() writes tts-v1-<hash>.json to disk
  → inject to WebView
  → speech_started ~2000ms after avatar_ready
```

### 5. Avatar Speaks (WebView → RN bridge)
```
WebView receives:  { type: "speakAudio", audioBase64, visemes, visemeTimes, ... }
WebView decodes:   base64 audio → AudioContext (playback-worklet.js)
WebView animates:  Three.js morph targets sync'd to viseme timeline
RN receives:       { type: "speech_started" }  → setStatusLabel("speaking")
RN receives:       { type: "speech_finished" } → advanceSpeechQueue()
```

### 6. Speech Queue + Prefetch
`speechQueue` is an array. `speechQueue[0]` = active (being spoken). `speechQueue[1]` = next.

While item[0] is speaking, a background `useEffect` prefetches TTS for item[1]:
```
getCachedSpeech(queue[1].text) → miss → fetch → cacheSpeech()
```
When item[0] finishes → `advanceSpeechQueue()` → item[1] becomes active → cache hit → plays instantly.

### 7. User Input → Intent Flow
```
User types message → sendMessage()
  setIsReplying(true)          → input disabled, typing indicator shown
  POST /mbts-api/intent        → returns { message } or { newMessage }
  addAvatarMessage(text)       → appends to messages[], pushes to speechQueue
  setIsReplying(false)
```
The new message enters the queue. If the avatar is already speaking, it queues after the current item.

---

## WebView Bridge Protocol

Messages from RN → WebView via `injectJavaScript()`:

| Type | Payload | Effect |
|---|---|---|
| `speakAudio` | `{ audioBase64, visemes, visemeTimes, ... }` | Plays audio + lip sync |
| `setAvatar` | `{ avatar: "prithi" \| "camilia" }` | Switches 3D model |
| `setMood` | `{ mood: "happy" \| "neutral" \| ... }` | Adjusts expression |
| `setBackground` | `{ background: "bg1.jpg" }` | Changes background |
| `displayText` | `{ text }` | Shows subtitle overlay |

Messages from WebView → RN via `window.ReactNativeWebView.postMessage()`:

| Type | Meaning |
|---|---|
| `avatar_ready` | Three.js loaded, GLBs decoded, ready to speak |
| `speech_started` | Audio playback began |
| `speech_finished` | Audio finished → advance queue |
| `avatar_prefetched` | Second avatar model loaded into memory |
| `avatar_error` | Runtime error in WebView |

---

## Asset Layout (inside APK)

```
android_asset/
└── avatar-web/
    ├── index.html          (3.8KB — XHR polyfill + module loader)
    ├── app.js              (1.8MB — Three.js + TalkingHead + main.js, esbuild bundle)
    ├── playback-worklet.js (8.4KB — AudioWorklet for gapless audio)
    ├── avatars/
    │   ├── manifest.json   (avatar catalog)
    │   ├── prithi.glb      (8.6MB — meshopt compressed)
    │   └── Camilia.glb     (2.7MB — meshopt compressed)
    └── backgrounds/
        ├── bg1.jpg … bg5.jpg
```

Built by: `node scripts/build-avatar-embed.mjs`  
Stored at: `android-local-assets/avatar-web/` (project root, outside `android/`)  
Included via: `android/app/build.gradle` → `sourceSets { main { assets.srcDirs += ["${projectRoot}/android-local-assets"] } }`

> **Important:** This `sourceSets` line must be re-added after any `expo prebuild --clean`. It is not in `app.json` (no Config Plugin yet).

---

## TTS Cache

**Location:** `FileSystem.cacheDirectory + "tts-v1-<hash>.json"`  
**Key:** DJB2 hash of `"${text}|${avatarId}|${voiceId}"`  
**Value:** `{ audioBase64, words, wordTimes, wordDurations, visemes, visemeTimes, visemeDurations }`  
**Invalidation:** Never (TTS output is deterministic per input). OS clears on low storage.  
**Cold start:** First install — each unique phrase fetches from Heroku once, then cached forever.

---

## Permissions (Android)

| Permission | Why |
|---|---|
| `INTERNET` | API calls, TTS fetch |
| `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | expo-audio background playback |
| `MODIFY_AUDIO_SETTINGS` | Audio output control |
| `READ/WRITE_EXTERNAL_STORAGE` (maxSdkVersion 32) | expo-file-system on Android ≤ 12 |
| `VIBRATE` | expo-haptics |

**Removed:** `RECORD_AUDIO` (app never records), `SYSTEM_ALERT_WINDOW` (dev overlay only).

---

## Key Files

| File | Role |
|---|---|
| `src/app/index.tsx` | HomeScreen — chat state, speech queue, TTS dispatch |
| `src/app/_layout.tsx` | Root layout — Heroku warmup on mount |
| `src/components/avatar/AvatarWebView.js` | WebView wrapper — bridge, queue flush, timing logs |
| `src/components/avatar/avatarBridge.js` | URL builder — Android uses `file://`, iOS/web uses Vercel |
| `src/components/avatar/speechProvider.js` | Speech mode config — always `service` mode in production |
| `src/utils/speechCache.ts` | TTS disk cache — read/write JSON keyed by hash |
| `avatar-embed/index.html` | WebView entry — XHR polyfill for `file://` fetch |
| `avatar-embed/src/main.js` | WebView runtime — Three.js, TalkingHead, message handler |
| `scripts/build-avatar-embed.mjs` | Build script — esbuild + copy to `android-local-assets/` |
| `android/app/build.gradle` | Gradle config — `sourceSets` wires local assets into APK |
| `metro.config.js` | Metro config — blocks `assets/models/*.glb` (Filament spike, ~32MB) |
| `app.json` | Expo config — package `com.mbts.botcierge`, name `MBTS 3D` |

---

## Remaining Tasks

### Before Play Store submission
- [ ] **Release keystore** — generate a proper signing key (not debug keystore). Store it securely. Lost = can never update the app on Play Store.
  ```bash
  keytool -genkey -v -keystore mbts-release.keystore -alias mbts -keyalg RSA -keysize 2048 -validity 10000
  ```
  Then add to `android/app/build.gradle` `signingConfigs.release`.
- [ ] **`versionCode` bump** — increment `android.versionCode` in `app.json` before each Play Store upload.
- [ ] **Production env vars** — set `EXPO_PUBLIC_MBTS_API_URL` and `EXPO_PUBLIC_AVATAR_SPEECH_API_URL` to production Heroku URLs in `.env` / `eas.json`.
- [ ] **EAS setup** — `eas build --platform android --profile production` for AAB upload to Play Store.

### iOS (needs Mac + Xcode)
- [ ] **TASK-07** — copy `android-local-assets/avatar-web/` to iOS bundle, update `bundledAvatarWebViewUrl` to return `file://` path for iOS.

### Nice to have
- [ ] **Expo Config Plugin** for the `sourceSets` block — so `expo prebuild --clean` doesn't require manual re-patch of `build.gradle`.
- [ ] **TASK-05/06** — CDN-hosted GLBs (Cloudflare R2) + on-device download cache. Needed if avatars grow beyond APK size limits or get updated frequently.
- [ ] **Pre-bundled TTS audio** — bundle the 3-4 common greeting phrases as MP3s in the APK to eliminate cold-start TTS latency on first install.
