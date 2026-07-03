# External Integrations

**Analysis Date:** 2026-07-03

## APIs & External Services

**Chat & LLM:**
- chatcamille.ai - Conversational AI backend
  - Endpoint: `https://www.chatcamille.ai/api/chat`
  - Method: POST
  - Client: `src/hooks/useSendMessage.ts` (via `fetch`)
  - Request: Message, avatar name, user ID, authentication status, conversation history
  - Response: Chat reply and metadata
  - Used for: Main conversation engine with avatar

**User Management & Authentication:**
- MBTS API (Heroku) - User identity verification and data management
  - Base URL: Configured via `EXPO_PUBLIC_MBTS_API_URL` (defaults to `https://mbts.herokuapp.com/`)
  - Configured in: `src/config.js`, `src/utils/api.js`
  - Endpoints:
    - `POST /users/getPersonById` - Verify user identity by ID
      - Client: `src/hooks/useGetPerson.ts`
      - Payload: User ID
      - Returns: Verified person data including packages and avatar preferences
  - Auth: None (public API, user ID in payload)

**Speech Synthesis:**
- Avatar Speech API (Heroku staging) - Text-to-speech synthesis
  - Base URL: Configured via `EXPO_PUBLIC_AVATAR_SPEECH_API_URL` (defaults to `https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/`)
  - Configured in: `src/config.js`
  - Endpoints:
    - `POST /avatarSpeech/synthesize` - Convert text to speech with viseme data
      - Client: `src/hooks/useSpeech.ts`
      - Payload: Text, avatar ID, mood/emotion, voice ID
      - Response: Base64 audio, viseme timings for lip-sync
    - `GET /avatarSpeech/health` - Warm up dyno and TTS worker
      - Client: `src/app/_layout.tsx` (called on app startup)
  - Features: Viseme synchronization for animated lip-sync
  - Caching: Speech responses cached in MMKV storage (`src/utils/speechCache.ts`)

**Avatar Web Rendering:**
- Vercel-hosted web application - 3D avatar rendering
  - URL: Configured via `EXPO_PUBLIC_AVATAR_WEB_VIEW_URL` (defaults to `https://mbts3d-avatar.vercel.app/`)
  - Configured in: `src/config.js`
  - Implementation: Loaded via React Native WebView
  - Communication: Message passing for:
    - `speakAudio` - Send speech data with word timings and viseme data
    - Avatar animations and emotion changes
  - Asset: Prebuilt web bundle with Three.js or Babylon.js 3D engine

## Data Storage

**Local Storage:**
- react-native-mmkv-storage - Encrypted file-based key-value store
  - Location: `src/utils/mmkv.js`
  - Purpose: Caching speech synthesis results, persistent state
  - Features: Encryption enabled
  - Persistence: Redux Persist integrates with this storage

**In-Memory State:**
- Redux store - Conversation history, user auth state, chat messages
  - Configuration: `src/redux/`
  - Persisted via Redux Persist to MMKV storage
- Zustand stores - Alternative lightweight state management
  - `src/stores/chatStore.ts` - Chat messages, conversation state, auth flow
  - `src/stores/avatarStore.ts` - Avatar selection and rendering state

**File System Cache:**
- expo-file-system - Caches speech synthesis audio files locally
  - Implementation: `src/utils/speechCache.ts`
  - Purpose: Avoid re-downloading already-synthesized speech

**Database:**
- None - This is a client-only application
- Backend APIs handle all persistent data

## Authentication & Identity

**Auth Provider:**
- Custom (MBTS API-based)
  - Implementation: Multi-step verification flow in `src/hooks/useAuthFlow.ts`
  - Challenge questions: Favorite color, home country, home state, mother's maiden name
  - User identification: Search MBTS API by name, verify against challenge answers
  - No OAuth/third-party auth

**Session Management:**
- In-memory state (Redux + Zustand)
- Authenticated user stored in chat state (`src/stores/chatStore.ts`)
- No token-based authentication visible

## Monitoring & Observability

**Error Tracking:**
- None detected (errors logged to console via try-catch blocks)

**Logs:**
- Console logging only
- Debug statements: `console.log('[useSpeech][error]', err)` pattern in `src/hooks/useSpeech.ts`
- No external logging service (Sentry, LogRocket, etc.)

**Analytics:**
- None detected

## CI/CD & Deployment

**Hosting:**
- Expo (via `expo-router` and Expo build system)
- Avatar Web: Vercel (separate deployment)
- MBTS API: Heroku
- Speech API: Heroku (staging)

**Build Pipeline:**
- Local development: `npm start` → Expo Metro bundler
- iOS: `npm run ios` → Expo build
- Android: `npm run android` → Expo build
- Web: `npm run web` → Static build output to `dist/`

**CI/CD Service:**
- Not detected (no GitHub Actions, CircleCI, etc.)
- Local/manual builds via Expo CLI

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Avatar speech synthesis (request/response pattern, not webhooks)
- Chat API (request/response pattern, not webhooks)

## Environment Configuration

**Required Environment Variables:**
```
EXPO_PUBLIC_MBTS_API_URL              # Main MBTS API endpoint
EXPO_PUBLIC_AVATAR_SPEECH_API_URL     # Speech synthesis API
EXPO_PUBLIC_AVATAR_WEB_VIEW_URL       # Avatar web view URL
```

**Defaults (if env vars not set):**
- MBTS API: `https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/`
- Avatar Speech: `https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/`
- Avatar Web: `https://mbts-3d-native-bundle.vercel.app/`

**Secrets Location:**
- `.env` file (local only, not committed)
- `.env.local` file (local overrides)
- Template: `.env.example`

## Network Configuration

**API Communication:**
- Method: Standard HTTPS/REST with `fetch` API
- Headers: Content-Type: application/json, Accept: application/json
- Error handling: Basic (throw on non-2xx responses, catch and log)
- No retry logic implemented
- No request rate limiting

**WebView Communication:**
- React Native ↔ WebView message passing
- Methods: `postMessage`, event listeners
- Purpose: Controlling avatar animations and speech playback

## Data Flow

**Chat Flow:**
1. User enters message in app
2. App sends to chatcamille.ai API
3. AI returns reply text
4. Text queued for speech synthesis via Avatar Speech API
5. Speech synthesis returns audio + viseme data
6. Audio cached locally
7. Speech sent to WebView for avatar animation playback
8. Chat history stored in Redux + MMKV

**Authentication Flow:**
1. User enters name → searches MBTS API by first name
2. Candidate users returned (name matches)
3. System asks verification questions from MBTS user profile
4. User answers questions
5. System filters candidate users by answers
6. `POST /users/getPersonById` called to verify final candidate
7. User marked authenticated in state
8. Retrieved user's avatar preference loaded

---

*Integration audit: 2026-07-03*
