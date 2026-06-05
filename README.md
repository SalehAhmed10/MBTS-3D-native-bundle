# MBTS 3D Native Spike

MBTS 3D Native Spike is the Expo / React Native version of the BOTCierge experience. It is a mobile-first chat app with a 3D avatar, speech synthesis, avatar selection, background selection, and MBTS backend-driven intent handling.

The currently active avatar path uses the bundled WebView avatar site. A native `react-native-filament` renderer also exists in the repo, but it is not the main runtime path in `src/app/index.tsx` today.

## What This App Does

- Shows a chat-style BOTCierge home screen
- Lets the user choose between multiple avatars, including Prithi and Camilia
- Supports avatar backgrounds and mood selection
- Sends chat messages to the MBTS backend for intent and login flows
- Plays synthesized speech for avatar replies
- Syncs avatar movement and lip motion during speech

## Project Structure

- `src/app/index.tsx` - main home screen and chat flow
- `src/components/filament-preview.tsx` - native Filament avatar renderer prototype
- `src/components/native-avatar-speech.tsx` - speech, lip-sync, and avatar speech UI
- `src/config.js` - shared runtime configuration and API endpoints

## Requirements

- Node.js 22 or newer
- Android Studio + Android SDK for Android builds
- Xcode for iOS builds on macOS
- An Expo development build, not Expo Go

## Environment Variables

Create a local `.env` file with public Expo variables:

```bash
EXPO_PUBLIC_MBTS_API_URL=https://your-mbts-api.example.com/
EXPO_PUBLIC_AVATAR_SPEECH_API_URL=https://your-avatar-speech-api.example.com/
EXPO_PUBLIC_AVATAR_WEB_VIEW_URL=https://your-avatar-site.example.com/
```

The app reads these values from `src/config.js`. If they are not set, it falls back to the staging Heroku/Vercel URLs already in the code.

## Install

If dependency resolution complains, use the legacy peer-deps mode:

```bash
npm install --legacy-peer-deps
```

## Run

Start the Expo dev server:

```bash
npm run start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

If native modules change, rebuild the app after reinstalling dependencies.

## Notes For The Client

- The avatar is currently rendered through the bundled WebView experience, so the avatar site is part of the runtime flow.
- The native Filament renderer is kept in the repo as an experimental/alternative path.
- The app depends on the MBTS backend for intent/chat responses and on the avatar speech service for audio generation.
- If you change avatar models or renderer behavior, rebuild the dev client before testing again.

## Optional Avatar Bundle Build

There is a helper script for avatar bundle work:

```bash
npm run build:avatar-embed
```

Use that only if you are regenerating the avatar bundle assets.

## Troubleshooting

- If the app crashes after installing packages, run `npm install --legacy-peer-deps` again and rebuild the dev client.
- If the avatar is blank after code changes, clear Metro cache with `npx expo start -c`.
- If speech is slow, check that the backend URLs in `.env` are reachable.
