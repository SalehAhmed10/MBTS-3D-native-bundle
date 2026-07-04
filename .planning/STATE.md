# BOTCIERGE Mobile — Project State

**Project:** BOTCIERGE Mobile
**Status:** Planning (Phase 1 avatar/background work confirmed on device; PROD items remain)
**Last Activity:** 2026-07-04

---

## Phase Status

| Phase | Name | Status | Plans | Notes |
|-------|------|--------|-------|-------|
| 1 | Avatar & Background Expansion | Avatars/backgrounds confirmed on device; APK cleanup done; PROD items open | 3 (01, 02, 03 all have completion summaries) | Device-verified 2026-07-04 on TECNO KL7: 4/5 avatars, background gallery + persistence all work. TTS audio playback and PROD-01/03 fixes still open. |
| 2 | Performance, Polish & Production Hardening | Unplanned | 0 | PROD-01 (LogBox) and PROD-03 (allowUniversalAccessFromFileURLs) already known open items from Phase 1 review |
| 3 | iOS Foundation | Unplanned | 0 | Depends on Phase 2. Likely smaller than scoped — CDN download architecture is already cross-platform. |

---

## Current Focus

**Phase:** 1 — Avatar & Background Expansion (device verification done, deciding whether to formally close the phase or address PROD-01/03 first)
**Plan:** —
**Blocker:** None

---

## Key Decisions Log

| Date | Decision | Outcome |
|------|----------|---------|
| 2026-06-15 | WebView + Three.js renderer | Committed — matches chatcamille.ai |
| 2026-06-15 | Filament renderer removed | Done (2026-07-04) — GLBs, dead components, and package.json deps all removed |
| 2026-06-15 | Camille as default avatar | Done |
| 2026-06-15 | No EAS yet | Deferred — client hasn't confirmed store submission |
| 2026-06-16 | CDN download + local cache replaces Android local-asset bundling (`7f890f4`) | Committed — resolves Benjamin GLB size for all avatars, gives cross-platform parity ahead of Phase 3. Docs (PROJECT/REQUIREMENTS/ROADMAP) reconciled 2026-07-04. |
| 2026-07-04 | Removed orphaned `plugins/with-android-local-assets.js` + `android-local-assets/` dir (dead since the CDN pivot) | Done |

---

## Accumulated Context

### Known Constraints
- APK size budget is now mostly about app code + native deps, not avatar assets (assets download post-install) — needs a fresh measurement, not the original <100MB asset-budget framing
- Margie avatar GLB not yet confirmed delivered — implement when asset arrives
- allowUniversalAccessFromFileURLs is still enabled unconditionally in AvatarWebView.js (security debt — PROD-03, not yet fixed)
- LogBox.ignoreAllLogs() still present in src/app/_layout.tsx and masks real errors in dev (PROD-01, not yet fixed)
- TTS audio playback (voice correctness) not verified — chat-send flow wasn't exercised end-to-end during the 2026-07-04 device pass (soft-keyboard text entry via adb was unreliable)

### Asset Inventory (as of 2026-07-04)
- `avatar-embed/`: Vercel deployment source (Camilia.glb, prithi.glb, Benji.glb, john.glb, manifest.json, 14 background images) — served at `https://mbts-3-d-native-bundle.vercel.app/`
- `src/services/avatarBundleManager.js`: downloads core bundle (~5MB) + lazy per-avatar GLBs to `FileSystem.documentDirectory` on-device, cached and offline after first launch
- `assets/models/` (Filament dead copies) — removed
- `android-local-assets/` and `plugins/with-android-local-assets.js` (old bundling approach) — removed 2026-07-04, both were orphaned/gitignored
- John + Benjamin GLBs confirmed present in avatar-embed/; Margie GLB still not delivered

### Todos
- Verify TTS audio playback (voice correctness) end-to-end — not completed 2026-07-04, needs manual chat-send test with actual listening
- Confirm Margie GLB delivery timeline with client
- Client to provide production backend URL (Heroku staging stays for now)
- Fix PROD-01 (LogBox.ignoreAllLogs) and PROD-03 (allowUniversalAccessFromFileURLs) — both still open, scoped to Phase 2
- Re-measure APK size now that avatar assets are CDN-delivered, not bundled
- Argent MCP tap/screenshot tools don't work on this Windows+Android setup (missing simulator-server binary for win32) — device verification had to fall back to raw adb; worth noting for future sessions

---

## Completed Phases

None yet.

---

## Session Continuity

To resume: read `.planning/ROADMAP.md` and `.planning/phases/01-avatar-background-expansion/` (3 plans already exist). Run `/gsd-discuss-phase 1` to continue context-gathering against the reconciled docs, then decide whether to replan or move straight to device verification of the existing plans.
