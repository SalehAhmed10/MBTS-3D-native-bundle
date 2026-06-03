# Avatar Embed

This folder is the controlled production avatar surface for the mobile app.

It is derived from the working `PrithiLipSync` runtime, but stripped down to only the pieces the native app needs:

- render avatar
- swap avatar
- apply mood
- apply background
- play `speakAudio` payloads from the app/backend

It intentionally does **not** include:

- demo header/hamburger/chat/input UI
- browser-side HeadTTS flow
- voice model downloads
- local chat controls

## Deploy

Deploy this folder as a static site.

Recommended hosts:

- Vercel
- Cloudflare Pages
- S3 + CloudFront

The host should serve `index.html` at the site root and preserve the runtime files:

- `app.js`
- `playback-worklet.js`
- `avatars/`
- `backgrounds/`

Source and rebuild inputs kept in the repo:

- `src/`
- `modules/`

## App Wiring

After deployment, point the app to the deployed embed URL:

`EXPO_PUBLIC_AVATAR_WEB_VIEW_URL=https://your-avatar-embed-host.example.com/`

## Runtime Contract

The page exposes `window.handleReactNativeMessage(payload)` and accepts:

- `setAvatar`
- `setMood`
- `setBackground`
- `speakAudio`

It posts these bridge events back to the app:

- `avatar_ready`
- `speech_started`
- `speech_finished`
- `avatar_error`

## Why This Shape

This is the best latency / maintainability tradeoff for the current app:

- React Native owns the app UI
- the embed page owns avatar rendering only
- MBTS backend owns business logic
- avatar speech backend owns TTS + viseme generation

That avoids browser-side model TTS warm-up, keeps deployment simple, and reduces duplication.

## Rebuild

If you update the embed runtime source, regenerate the committed bundle before pushing:

`npm run build:avatar-embed`
