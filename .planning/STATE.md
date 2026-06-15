# BOTCIERGE Mobile — Project State

**Project:** BOTCIERGE Mobile
**Status:** Planning
**Last Activity:** 2026-06-15

---

## Phase Status

| Phase | Name | Status | Plans | Notes |
|-------|------|--------|-------|-------|
| 1 | Avatar & Background Expansion | Unplanned | 0 | Next up |
| 2 | Performance, Polish & Production Hardening | Unplanned | 0 | — |
| 3 | iOS Foundation | Unplanned | 0 | Depends on Phase 2 |

---

## Current Focus

**Phase:** None yet — awaiting planning
**Plan:** —
**Blocker:** None

---

## Key Decisions Log

| Date | Decision | Outcome |
|------|----------|---------|
| 2026-06-15 | WebView + Three.js renderer | Committed — matches chatcamille.ai |
| 2026-06-15 | Filament renderer removed | Saves ~32MB from APK; removal tracked in APK-01, APK-02 |
| 2026-06-15 | Camille as default avatar | Done |
| 2026-06-15 | No EAS yet | Deferred — client hasn't confirmed store submission |
| 2026-06-15 | Benjamin GLB (31MB) bundle vs remote | TBD during Phase 1 planning (APK-03) |

---

## Accumulated Context

### Known Constraints
- APK must stay under 100MB (Google Play direct download limit)
- Benjamin GLB is 31MB — needs a bundle-vs-lazy-load decision before Phase 1 closes
- Margie avatar GLB not yet confirmed delivered — implement when asset arrives
- allowUniversalAccessFromFileURLs is currently enabled too broadly (security debt — PROD-03)
- LogBox.ignoreAllLogs() masks real errors in dev and must not ship to prod (PROD-01)

### Asset Inventory (as of init)
- android-local-assets/: Camille (Camilia.glb 2.7MB), Prithi (prithi.glb 8.6MB), 5 bg images
- assets/models/: camilia.glb (23MB) + prithi.glb (8.6MB) — Filament dead copies, remove in Phase 1
- Benji.glb (31MB) — exists, decision pending
- John + Margie GLBs — status unconfirmed

### Todos
- Confirm John and Margie GLB availability before Phase 1 starts
- Confirm Margie GLB delivery timeline with client
- Client to provide production backend URL (Heroku staging stays for now)

---

## Completed Phases

None yet.

---

## Session Continuity

To resume: read `.planning/ROADMAP.md` for phase goals and success criteria, then run `/gsd-plan-phase 1` to begin planning Phase 1.
