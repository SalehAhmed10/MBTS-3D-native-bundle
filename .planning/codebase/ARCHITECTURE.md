# Architecture

**Analysis Date:** 2026-07-03

## Pattern Overview

**Overall:** Client-server mobile app with embedded WebView-based 3D avatar integration

**Key Characteristics:**
- React Native with Expo (iOS/Android cross-platform)
- Zustand for global state management
- Expo Router for navigation
- WebView bridge for 3D avatar rendering (hosted separately)
- React Query for server-state mutations
- Multi-provider structure (Theme, QueryClient, Zustand stores)

## Layers

**Presentation Layer:**
- Purpose: Render UI components and handle user interactions
- Location: `src/app/`, `src/components/`
- Contains: Screen components, modals, UI elements (input, text, buttons, dropdowns)
- Depends on: Zustand stores, custom hooks, constants
- Used by: Expo Router for navigation

**State Management Layer:**
- Purpose: Manage global application state (avatar settings, chat state)
- Location: `src/stores/`
- Contains: Zustand store definitions for avatar and chat
- Depends on: MMKV storage for persistence, TypeScript types
- Used by: Components and hooks

**Business Logic Layer:**
- Purpose: Encapsulate domain logic for auth, speech, messaging, chat flows
- Location: `src/hooks/`
- Contains: Custom React hooks (useAuthFlow, useSendMessage, useSpeech, useGetPerson)
- Depends on: Stores, API utilities, services, types
- Used by: Screen components

**Service/Integration Layer:**
- Purpose: Manage external API calls, file system operations, asset caching
- Location: `src/services/`, `src/utils/`
- Contains: avatarBundleManager, API configuration, speech caching, utility functions
- Depends on: Expo File System, fetch API, configuration
- Used by: Hooks, components

**Type Layer:**
- Purpose: Define TypeScript types for data structures
- Location: `src/types/`
- Contains: Chat types (ChatMessage, ChatStep, AuthProperty, CandidateUser), Avatar types
- Depends on: Nothing
- Used by: All layers for type safety

## Data Flow

**Chat Message Flow (Intent/Regular):**

1. User types message in input field
2. `sendMessage()` handler called in HomeScreen
3. Message added to chat store (displayed immediately)
4. `useSendMessage` mutation triggered
5. Mutation reads conversation history from chat store + avatar settings
6. POST to `https://www.chatcamille.ai/api/chat` with context
7. Response processed: emotion applied, reply extracted
8. Reply normalized and added to chat store
9. Speech item queued for synthesis

**Authentication Flow (Multi-step):**

1. User enters name → triggers name validation in `useAuthFlow`
2. Name accepted → chat step changes to 'intent'
3. User types intent → triggers auth API check via `useSendMessage`
4. If type='authentication', backend returns candidate users
5. Chat step changes to 'auth', users stored in chat store
6. Avatar asks confirmation question
7. User answers → `handleAuthMessage` in `useAuthFlow` filters users by auth property
8. Loop continues through auth properties (favoriteColor, homeCountry, homeState, mothersMaidenName)
9. When single user remains or auth properties exhausted → `useGetPerson` verification
10. On success: authenticated flag set, chat step changes to 'intent'

**Avatar Rendering Flow:**

1. AvatarWebView mounts → checks if local bundle cached via `isBundleCached()`
2. If not cached → downloads core bundle (~5MB) with progress indicator
3. Simultaneously checks if initial avatar GLB cached via `isAvatarGlbCached()`
4. Downloads GLB if needed (Camilia, Prithi, Benjamin, John)
5. Once ready → injects JavaScript bootstrap script to hide Web UI chrome
6. Avatar page loads 3D model, sends 'avatar_ready' message
7. WebView receives ready event, flushes pending speech/mood/avatar/background payloads

**Speech Synthesis Flow:**

1. Speech queue populated in chat store
2. `useSpeech` hook monitors queue[0] (active speech)
3. Checks speech cache for text+avatar+voice combination
4. If cached → uses cached audio payload
5. If not cached → POST to `SPEECH_SYNTHESIS_ENDPOINT` with TTS request
6. Receives audio base64 + word timings + visemes for lip-sync
7. Caches result locally
8. Passes payload to WebView via `speakAudio` method
9. WebView plays audio, avatar lip-syncs with viseme data
10. 'speech_finished' event triggers speech queue advance

**State Management:**

Avatar state persists selected background to MMKV storage (other selections in-memory). Chat state is transient within session. Conversation history stored in chat store for context on next API call.

## Key Abstractions

**AvatarWebView:**
- Purpose: Bridges React Native component tree with 3D WebView runtime
- Examples: `src/components/avatar/AvatarWebView.js`
- Pattern: Forwardable ref component with imperative methods (setAvatar, setMood, setBackground, speakAudio)
- Communication: Message passing via `onMessage` callback, script injection via `injectJavaScript()`
- Lifecycle: Manages bundle download state, GLB caching, WebView readiness

**Zustand Stores:**
- Purpose: Single source of truth for UI state
- Examples: `src/stores/avatarStore.ts`, `src/stores/chatStore.ts`
- Pattern: Factory function defining state + setters, lazy initialization
- Persistence: avatarStore persists selected background; chatStore is session-scoped
- Subscribers: Components access via hooks (e.g., `useAvatarStore()`)

**Custom Hooks:**
- Purpose: Encapsulate reusable logic and side effects
- Examples: `useSendMessage`, `useAuthFlow`, `useSpeech`, `useGetPerson`
- Pattern: React hooks returning data, mutations, or functions; often wrap Zustand/React Query

**Avatar Bundle Manager:**
- Purpose: Orchestrate downloading, caching, and versioning of avatar web runtime
- Examples: `src/services/avatarBundleManager.js`
- Pattern: Utility functions for download, cache checks, progress reporting
- Storage: Local file system (`FileSystem.documentDirectory/avatar-web/`)
- Versioning: Bump BUNDLE_VERSION string to force re-download on app update

## Entry Points

**Application Root:**
- Location: `src/app/_layout.tsx`
- Triggers: Expo Router initialization
- Responsibilities: Set up global providers (QueryClient, ThemeProvider), health check on mount

**Main Screen:**
- Location: `src/app/index.tsx`
- Triggers: After layout initialization
- Responsibilities: Render main chat UI, avatar panel, message list, input bar, settings modal

**Settings Modal:**
- Triggered: Hamburger menu button press
- Responsibilities: Avatar selection, emotion/voice/background customization via dropdowns

## Error Handling

**Strategy:** Fail-safe with user-facing messages

**Patterns:**
- Chat API errors → display to user as avatar message ("I could not reach BOTcierge right now")
- Auth API errors → reset auth flow, prompt re-registration
- WebView errors → show error state in avatar panel, fallback to hosted URL if bundle fails
- TTS errors → log, skip, advance queue (best-effort)
- GLB download errors → warn in console, retry on next avatar selection

## Cross-Cutting Concerns

**Logging:** Console logging for WebView lifecycle, avatar events, speech cache hits/misses. Tags: `[AVT]`, `[AvatarWebView]`, `[useSpeech]`, `[speechCache]`.

**Validation:** Input validation in `useAuthFlow` for name (alphanumeric, no spaces), auth answers (length limits). Avatar names normalized to lowercase.

**Authentication:** Multi-property verification against backend user database. No local token storage; identity verified per-session.

---

*Architecture analysis: 2026-07-03*
