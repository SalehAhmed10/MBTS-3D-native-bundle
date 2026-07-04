---
phase: 01-avatar-background-expansion
plan: 03
status: complete
date: 2026-06-15
---

# Plan 03 Execution Summary

## Compressed Background Sizes

| File | Size | Status |
|------|------|--------|
| bg_nyc2.jpg | 118KB | OK |
| bg_dubai.jpg | 76KB | OK |
| bg_hongkong.jpg | 102KB | OK |
| bg_beijing.jpg | 74KB | OK |
| bg_munich.jpg | 70KB | OK |
| bg_glasgow.jpg | 70KB | OK |
| bg_honolulu.jpg | 74KB | OK |
| bg_spaceship.jpg | 82KB | OK |

All 8 new files under 120KB (well within 250KB budget). Sharp quality:60, max width:1280px.

## Persistence Library

Used `react-native-mmkv-storage` (v12.0.1) synchronous API — `mmkvStorage.getString` / `mmkvStorage.setString`. Reused the existing `mmkvStorage` instance from `src/redux/storage/storage.js`.

`@react-native-async-storage/async-storage` is not installed in this project.

## Changes Made

- `scripts/compress-backgrounds.mjs` — new one-off compression script
- `scripts/build-avatar-embed.mjs` — changed hardcoded bg1–bg5 list to glob all `*.jpg` in avatar-embed/backgrounds/
- `avatar-embed/backgrounds/` — 8 new compressed bg_*.jpg files added
- `assets/avatar-backgrounds/` — 8 matching copies for RN require()
- `android-local-assets/avatar-web/backgrounds/` — 13 total files (5 existing + 8 new) after build run
- `src/app/index.tsx`:
  - BACKGROUND_OPTIONS expanded from 6 to 14 entries (None + 5 existing + 8 new)
  - Removed `as const` constraint; now typed as `Array<{ id: string; label: string; color: string; source: ImageSourcePropType | undefined }>`
  - `selectedBackgroundId` type relaxed from union to `string`
  - Added MMKV load-on-mount useEffect (validates persisted ID against BACKGROUND_OPTIONS before applying)
  - Added MMKV save-on-change useEffect

## android-local-assets/avatar-web/backgrounds/ Total Size

~2.7MB (8 new files: ~666KB; 5 existing: ~2MB — bg1.jpg pre-existing uncompressed at 2MB)

## Device Test

Confirmed 2026-07-04 on physical device (TECNO KL7, serial 13018374C5000162):
- Cities category showed New York, Dubai, Hong Kong, Beijing thumbnails rendering correctly (one earlier screenshot caught them mid-load — false alarm, not a bug)
- Selecting New York applied the background immediately, visible behind the avatar/settings modal with no network request
- Force-stopped and relaunched the app: New York background persisted correctly via MMKV (survives restart)
- Avatar selection (John, selected before restart) did NOT persist — reverts to default Camille. This matches source code (`avatarStore.ts` only persists `selectedBackgroundId`, not `selectedAvatarId`) and no requirement (AV-01..04) mandates avatar-selection persistence, so this is expected behavior, not a gap.
