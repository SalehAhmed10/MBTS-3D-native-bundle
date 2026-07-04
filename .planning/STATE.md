# BOTCIERGE Mobile — Project State

**Project:** BOTCIERGE Mobile
**Status:** Planning (Phase 1 partially executed outside tracked state — see below)
**Last Activity:** 2026-07-04

---

## Phase Status

| Phase | Name | Status | Plans | Notes |
|-------|------|--------|-------|-------|
| 1 | Avatar & Background Expansion | Partially executed, unverified | 3 (01, 02, 03 written; only 03 has a completion summary) | Discovered 2026-07-04: plans 01/02 were executed on disk (avatars + Filament removal) but never logged here. Needs device verification before marking complete. |
| 2 | Performance, Polish & Production Hardening | Unplanned | 0 | — |
| 3 | iOS Foundation | Unplanned | 0 | Depends on Phase 2. Likely smaller than scoped — CDN download architecture is already cross-platform. |

---

## Current Focus

**Phase:** 1 — Avatar & Background Expansion (context gathering / replan in progress)
**Plan:** Reconciling docs with actual implementation before continuing discuss-phase
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
- None of Phase 1's on-device work has been verified — plans 01/02 executed without a summary or device confirmation

### Asset Inventory (as of 2026-07-04)
- `avatar-embed/`: Vercel deployment source (Camilia.glb, prithi.glb, Benji.glb, john.glb, manifest.json, 14 background images) — served at `https://mbts-3-d-native-bundle.vercel.app/`
- `src/services/avatarBundleManager.js`: downloads core bundle (~5MB) + lazy per-avatar GLBs to `FileSystem.documentDirectory` on-device, cached and offline after first launch
- `assets/models/` (Filament dead copies) — removed
- `android-local-assets/` and `plugins/with-android-local-assets.js` (old bundling approach) — removed 2026-07-04, both were orphaned/gitignored
- John + Benjamin GLBs confirmed present in avatar-embed/; Margie GLB still not delivered

### Todos
- Verify Phase 1 work on a real device/emulator: avatar switching (5 → 4 available), background gallery, first-launch download flow
- Confirm Margie GLB delivery timeline with client
- Client to provide production backend URL (Heroku staging stays for now)
- Fix PROD-01 (LogBox.ignoreAllLogs) and PROD-03 (allowUniversalAccessFromFileURLs) — both still open, scoped to Phase 2
- Re-measure APK size now that avatar assets are CDN-delivered, not bundled

---

## Completed Phases

None yet.

---

## Session Continuity

To resume: read `.planning/ROADMAP.md` and `.planning/phases/01-avatar-background-expansion/` (3 plans already exist). Run `/gsd-discuss-phase 1` to continue context-gathering against the reconciled docs, then decide whether to replan or move straight to device verification of the existing plans.
