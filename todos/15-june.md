# Todos — 15 June 2026

## Immediate (today)
- [x] Set Camille/Camilia as default avatar everywhere (config.js, index.tsx, AvatarWebView.js, avatarBridge.js, avatarSession.js)
- [ ] Remove Filament GLBs from assets/models/ (23MB camilia.glb + 8.62MB prithi.glb) — not used in WebView path, dead weight in APK
- [ ] Remove filament-preview.tsx and native-avatar-speech.tsx if fully abandoning Filament renderer
- [ ] Fix: remove LogBox.ignoreAllLogs() from _layout.tsx (hiding crashes)
- [ ] Fix: add AVATAR_NAME_MAP entry for 'prithi' in avatarBridge.js (currently only camilia/camille mapped)

## This Week — Avatar & Background Expansion
- [ ] Add 4 more avatar GLBs to android-local-assets/avatar-web/avatars/ (target: 6 total)
- [ ] Add avatar options to DEFAULT_AVATAR_OPTIONS in index.tsx for all 6 avatars
- [ ] Wire up background selection UI (already have bg1-bg5.jpg in android-local-assets)
- [ ] Expose background selector in AvatarWebView postMessage bridge
- [ ] Test all avatars on Android device (not just Camilia + Prithi)

## This Week — Production Readiness
- [ ] Replace staging Heroku URL fallback in config.js with prod URL or throw error if env var missing
- [ ] Add Sentry (or equivalent) error tracking — currently blind in prod
- [ ] Add error boundary component wrapping the main avatar view
- [ ] Fix: allowUniversalAccessFromFileURLs should be false on prod builds (WebView security)

## Architecture Questions Resolved (15 June)
- WebView + Three.js = correct approach. Aligns with chatcamille.ai web version. Keep it.
- Filament renderer (filament-preview.tsx) = abandoned experiment. Remove GLBs to save 32MB.
- 5-6 avatars = supported by current WebView arch, just need GLBs + config entries

## Upcoming — iOS
- [ ] Generate ios/ directory (expo prebuild --platform ios)
- [ ] Set up iOS bundle similar to android-local-assets
- [ ] Add iOS privacy manifest (required for App Store since spring 2024)
- [ ] Test on iOS simulator

## Backlog
- [ ] EAS Build setup (eas.json) when ready for store submission
- [ ] Replace debug keystore with production keystore for release builds
- [ ] Implement TTS cache (two implementations exist, neither complete)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Add error tracking + crash reporting
