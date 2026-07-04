---
phase: 01-avatar-background-expansion
plan: 02
status: complete
date: 2026-07-04
---

# Plan 02 Execution Summary

Verified on a physical device (TECNO KL7, Android, serial 13018374C5000162) against the rewritten plan (avatarBundleManager-based architecture, not the original Benjamin-only lazy-load spec).

## Device Verification Results (Task 3)

- Avatar picker dropdown shows exactly 4 avatars: Camille, Prithi, Benjamin, John — no Margie. Matches AV-01 (4/5 available).
- Selected Benjamin: loaded without a visible download stall (GLB was already warm from `preloadAllGlbs()` background prefetch), greeting updated to "Hello, I'm Benjamin...", voice dropdown showed "Benjamin Default".
- Selected John: same — loaded cleanly, greeting updated to "Hello, I'm John...", voice dropdown showed "John Default".
- Camera framing for both Benjamin and John looked correct on-device — head and shoulders properly framed, not cut off or over-zoomed.
- Checked `adb logcat` filtered to the app's PID across the full session (avatar switches, background switches, app restart): no crashes, no exceptions, no `avatar_error` events, no GLB download failures. One unrelated OEM warning (Transsion/TECNO `ClassNotFoundException` for a vendor display component) — harmless, not app-related.
- Did not verify actual TTS audio playback (voice correctness) — adb-based soft-keyboard text entry was unreliable on this device/session (input landed inconsistently), so the chat-send flow wasn't exercised end-to-end. Voice *assignment* is confirmed correct (dropdown shows the right voice label per avatar); voice *audio output* is unverified.

## Task 1 — cameraFOV Discrepancy

Resolved by visual inspection: manifest.json's mobile-specific values (cameraFOV 5-6, not MYBOTSTV's 10) produce correct framing on device for all avatars checked (Camille, Benjamin, John — via the persisted background view). Decision: **keep current manifest values** — they're already tuned for the mobile viewport, not a bug. Do not blindly copy MYBOTSTV's desktop FOV=10.

## Task 2 — AVATAR_ID_MAP Gap

`avatarBridge.js`'s `AVATAR_ID_MAP` (used by `denormalizeAvatarName`) only maps camilia/prithi, not benjamin/john. Traced usage: `denormalizeAvatarName` is only imported by `src/screens/Home.js` — the legacy pre-refactor screen, not the active `src/app/index.tsx` route. Confirmed via `expo-router` file-based routing that `Home.js` is not on the active navigation path. **No fix needed** — the gap is in dead code.

## Not Covered By This Pass

- TTS audio correctness (voice sounds right) — needs a manual listen-through, not verifiable via adb automation alone.
- iOS — no `ios/` directory yet (Phase 3).
- Backend sync for background selection (BG-03 backend half) — only local MMKV persistence was tested.
