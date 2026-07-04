# Architecture Refactor — MBTS-3D Native

Goal: shrink `src/app/index.tsx` from 1,410 lines to ~250 lines.  
Eliminate all `useEffect` except one `useMountEffect` for WebView bootstrap.  
Add Zustand (state) + React Query (data fetching). Retire unused Redux.

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Derive avatar greeting — remove from state + useEffect | ✅ done |
| 2 | Create Zustand `avatarStore` | ✅ done |
| 3 | Create Zustand `chatStore` | ✅ done |
| 4 | Create React Query hooks — `useSendMessage` + `useGetPerson` | ✅ done |
| 5 | Create `useSpeech` hook — replace 2 TTS useEffects | ✅ done |
| 6 | Create `useAuthFlow` hook — extract auth state machine | ✅ done |
| 7 | Wire stores + hooks into `index.tsx` — slim to ~250 lines | ✅ done |
| 8 | Retire Redux — decouple active code (legacy screens still reference slices) | ✅ done |

## Dependency Order

```
T1 (greeting) → can start immediately
T2 (avatarStore) → can start immediately
T3 (chatStore) → after T2
T4 (React Query hooks) → after T3
T5 (useSpeech) → after T4
T6 (useAuthFlow) → after T3
T7 (wire index.tsx) → after T4 + T5 + T6
T8 (retire Redux) → after T7
```

## Files Being Created

| File | Purpose |
|------|---------|
| `src/stores/avatarStore.ts` | Zustand: selectedAvatarId, voice, emotion, background |
| `src/stores/chatStore.ts` | Zustand: messages, chatStep, guestName, auth |
| `src/hooks/useSendMessage.ts` | React Query mutation: POST /api/chat |
| `src/hooks/useGetPerson.ts` | React Query mutation: POST /getPersonById |
| `src/hooks/useSpeech.ts` | TTS queue orchestration |
| `src/hooks/useAuthFlow.ts` | Auth state machine |

## Progress Log

- [x] T1: Derive avatar greeting — `messages` starts `[]`, `displayMessages` derived at render, removed `isFirstAvatarRender` ref + greeting-patch useEffect
- [x] T2: avatarStore — `src/stores/avatarStore.ts`, MMKV persistence baked in
- [x] T3: chatStore — `src/stores/chatStore.ts`, all chat/auth state
- [x] T4: React Query hooks — `useSendMessage.ts`, `useGetPerson.ts`, QueryClientProvider in _layout.tsx
- [x] T5: useSpeech — `src/hooks/useSpeech.ts`, TTS synth + prefetch
- [x] T6: useAuthFlow — `src/hooks/useAuthFlow.ts`, full auth state machine
- [x] T7: Wire index.tsx — 1410 → 1010 lines, 20 useState → 0, 8 useEffect → 0
- [x] T8: Retire Redux (active path) — mmkvStorage moved to `src/utils/mmkv.js`

## Notes

- After each task: `npm run android` to verify nothing broke
- Keep `AvatarWebView.js` unchanged — its imperative ref API is a good seam
- `speechCache.ts` stays as-is — already well-structured
- Redux removal in T8 only after T7 confirms nothing depends on it
