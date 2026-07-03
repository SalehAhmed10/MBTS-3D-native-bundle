# External Integrations

**Analysis Date:** 2026-07-03

## APIs & External Services

**Chat & Intent Processing:**
- ChatCamille API - Conversational AI backend
  - Endpoint: `https://www.chatcamille.ai/api/chat`
  - SDK/Client: Fetch API (native)
  - Method: POST
  - Used by: `src/hooks/useSendMessage.ts`
  - Payload: message, avatar, userId, userName, sessionName, authenticated status, conversation history, packages, SRX state
  - Response: reply text, emotion state, type (authentication), data (candidate users), srxState

**User & Identity Verification:**
- MBTS Backend API - Main application backend
  - Base URL: Configurable via `EXPO_PUBLIC_MBTS_API_URL` (defaults to `https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/`)
  - SDK/Client: Fetch API (native)
  - Endpoints:
    - `POST /users/getPersonById` - Verify user identity during auth flow
  - Used by: `src/hooks/useGetPerson.ts`
  - Auth: None (client-side)
  - Request: `{ user: { _id: string } }`
  - Response: PersonResponse with user data (email, name, home details, avatar preferences, packages)

**Text-to-Speech Synthesis:**
- Avatar Speech API - Voice synthesis and lip-sync generation
  - Base URL: Configurable via `EXPO_PUBLIC_AVATAR_SPEECH_API_URL` (defaults to `https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/`)
  - SDK/Client: Fetch API (native)
  - Endpoints:
    - `POST /avatarSpeech/synthesize` - Generate speech audio with visemes
    - `GET /avatarSpeech/health` - Health check (warms Heroku dyno)
  - Used by: `src/hooks/useSpeech.ts`
  - Request: text, avatar ID, mood/emotion, voiceId, voiceLabel
  - Response: WebViewSpeechPayload
    - audioBase64: Base64-encoded WAV audio
    - words: Array of spoken words
    - wordTimes: Start time of each word
    - wordDurations: Duration of each word
    - visemes: Array of viseme codes (e.g., "aa", "E", "I")
    - visemeTimes: Start time of each viseme
    - visemeDurations: Duration of each viseme

**Avatar Rendering & UI:**
- Avatar Web View Service - 3D avatar rendering and animation
  - URL: Configurable via `EXPO_PUBLIC_AVATAR_WEB_VIEW_URL` (defaults to `https://mbts3d-avatar.vercel.app/`)
  - SDK/Client: React Native WebView (`src/components/avatar/AvatarWebView`)
  - Communication: Window message passing (postMessage API)
  - Events:
    - `avatar_ready`: Avatar loaded, returns supportedAvatars descriptor
    - `speech_finished`: Audio playback completed
    - `avatar_error`: Avatar rendering error
  - Commands from app:
    - `setAvatar(avatarId)` - Switch avatar
    - `setBackground(backgroundId)` - Set scene background
    - `setMood(emotionId)` - Set avatar emotional state (neutral, happy, sad, angry, suggestive, love)
    - `speakAudio(payload)` - Play audio with lip-sync (words, visemes, timing data)
  - Hosting: Vercel

**Health Checks & Warmup:**
- Heroku Dyno Warmup
  - Endpoint: `${AVATAR_SPEECH_API_URL}avatarSpeech/health`
  - Called on app launch in `src/app/_layout.tsx`
  - Purpose: Prevent cold-start delays on TTS first request

## Data Storage

**Databases:**
- None detected - This is a client-side mobile/web app
- Backend data model inferred from API responses:
  - Users collection with: _id, email, firstName, lastName, homeCity, favoriteColor, homeCountry, homeState, mothersMaidenName
  - User preferences: avatarName, packages array
  - Conversation state: srxState (sent to chat API)

**File Storage:**
- Local File System (Expo File System)
  - Location: Application cache directory
  - Contents: Speech synthesis results (TTS cache)
  - Implementation: `src/utils/speechCache.ts`
  - Cache key: Hash of `{text}|{avatarId}|{voiceId}`
  - Format: JSON files with audioBase64, words, wordTimes, wordDurations, visemes, visemeTimes, visemeDurations
  - Lifecycle: Persisted across sessions, manually deleted on write errors

**Caching:**
- Local Speech Cache
  - Storage: Expo File System
  - Purpose: Avoid re-synthesizing same text/avatar/voice combination
  - Implementation: `src/utils/speechCache.ts` with getCachedSpeech() and cacheSpeech()
  - Hit detection: Logs `[speechCache] hit:` to console
  - Prefetch strategy: useSpeech hook prefetches next queue item while current plays

**Persistent Preferences:**
- MMKV Storage (Encrypted)
  - Used by: `src/stores/avatarStore.ts`
  - Data stored: selectedBackgroundId (with CDN validation)
  - Encryption: Enabled by default
  - Configuration: `src/utils/mmkv.js`

## Authentication & Identity

**Auth Provider:**
- Custom (Multi-factor identity verification)
- Implementation: `src/hooks/useAuthFlow.ts`

**Auth Flow:**
1. **Name Entry** - Guest provides first name (validation: alphanumeric + spaces + apostrophe)
2. **Intent Query** - Chat API receives intent, returns candidate users matching name
3. **Identity Challenge** - Sequential questions on stored profile data:
   - Favorite color (max 30 chars)
   - Home country (max 30 chars)
   - Home state (max 30 chars)
   - Mother's maiden name (max 50 chars)
4. **User Narrowing** - Each answer filters candidate users (substring match, case-insensitive)
5. **Verification** - GET `/users/getPersonById` to load full profile

**Session State:**
- guestName: Captured at start
- authenticated: Boolean flag set on successful verification
- person: Full user object with email, preferences, packages
- srxState: Opaque state from chat API (for multi-turn auth or SRX engine)

## Monitoring & Observability

**Error Tracking:**
- None detected - Errors logged to console only
- Error handling in:
  - `src/hooks/useSendMessage.ts`: Catch and throw HTTP errors
  - `src/hooks/useGetPerson.ts`: Throw verification errors
  - `src/hooks/useSpeech.ts`: Console.log('[useSpeech][error]', err)

**Logs:**
- Console logging: `console.log()` and `console.error()` calls
- Endpoints monitored: Health check to warm TTS dyno on app start

**Performance:**
- Speech cache hit logging: `[speechCache] hit:` prefix
- Write errors logged: `[speechCache] write-error`

## CI/CD & Deployment

**Hosting:**
- Expo Application Services (EAS) - Managed builds and hosting
- Vercel - Avatar WebView URL hosting
- Heroku - Backend APIs (staging: mbts-3d-staging-a97d3e5c7d7c.herokuapp.com)

**Build Scripts:**
- `npm start` - Expo dev server
- `npm run ios` - iOS simulator build
- `npm run android` - Android emulator build
- `npm run web` - Web build
- `npm run build:avatar-embed` - Custom avatar bundle build

**Configuration Management:**
- MCP (Model Context Protocol) servers configured in `.codex/config.toml`:
  - Expo MCP server at https://mcp.expo.dev/mcp
  - Maestro MCP for testing automation

## Environment Configuration

**Required Environment Variables:**
- `EXPO_PUBLIC_MBTS_API_URL` - Main backend (required, has fallback)
- `EXPO_PUBLIC_AVATAR_SPEECH_API_URL` - TTS service (required, has fallback)
- `EXPO_PUBLIC_AVATAR_WEB_VIEW_URL` - Avatar renderer (required, has fallback)

**Secrets Location:**
- `.env` file (local, not committed)
- `.env.local` file (local, not committed)
- See `.env.example` for template

**Configuration Precedence:**
1. Environment variables (process.env.EXPO_PUBLIC_*)
2. Fallback URLs in `src/config.js`

**Feature Flags:**
- `FEATURES.enableVoiceInput` - false (voice input disabled)
- `FEATURES.enableOfflineMode` - true (offline cache enabled)
- `FEATURES.enableChatHistory` - true (conversation history enabled)
- Defined in: `src/config.js`

## Webhooks & Callbacks

**Incoming Webhooks:**
- None detected

**Outgoing Webhooks:**
- None detected

**Event-Based Communication:**
- WebView Event Messages (bidirectional message passing)
  - Avatar Web View sends: `avatar_ready`, `speech_finished`, `avatar_error` events
  - App sends: `setAvatar`, `setBackground`, `setMood`, `speakAudio` commands
  - Implementation: `src/app/index.tsx` (handleAvatarEvent callback)

**WebSocket/Real-time:**
- None detected - All integrations are request-response (HTTP/fetch)

## External Service Dependencies

**Critical Path (Required for Core Functionality):**
1. ChatCamille API (`https://www.chatcamille.ai/api/chat`) - Chat responses
2. MBTS Backend (`https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/`) - User authentication
3. Avatar Speech API (TTS service) - Voice synthesis
4. Avatar WebView (Vercel) - 3D avatar rendering

**Optional (Graceful Degradation):**
- Health check endpoint - Performance optimization only (warms dyno)
- Speech cache - Performance optimization (falls back to live synthesis)

**Fallback Strategy:**
- All API URLs have environment variable overrides + sensible fallbacks in `src/config.js`
- Speech synthesis errors: Error message logged, speech queue advanced
- Chat API errors: User shown error message "I could not reach BOTCierge right now"
- Avatar auth errors: User directed to register at BOTCIERGE.com

---

*Integration audit: 2026-07-03*
