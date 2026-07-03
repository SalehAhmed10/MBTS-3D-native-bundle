# Architecture

**Analysis Date:** 2026-07-03

## Pattern Overview

**Overall:** Layered Mobile-Web Hybrid with Dual State Management

**Key Characteristics:**
- React Native + Expo with file-based routing (expo-router)
- Dual state management: Zustand for reactive UI state + Redux for persistent legacy data
- Component-based UI with custom hooks for business logic
- Embedded WebView rendering 3D avatar (Three.js)
- Multiple external API layers: Chat, Text-to-Speech, Backend services
- Lazy-loaded offline bundle caching for avatar assets

## Layers

**Presentation (UI Components):**
- Purpose: Render user interface, capture interactions, display avatar and messages
- Location: `src/app/`, `src/components/`
- Contains: React Native components (View, TextInput, Modal, ScrollView), styled sheets, event handlers
- Depends on: React Native, Expo, react-native-reanimated, Zustand stores
- Used by: App entry point, receives updates from stores and hooks

**State Management:**
- Purpose: Manage reactive UI state (avatar selection, chat messages, speech queue) and persistent user data
- Location: `src/stores/` (Zustand), `src/redux/` (Redux legacy)
- Contains: Zustand stores (avatarStore.ts, chatStore.ts), Redux slices (personSlice, postSlice, xShareSlice), reducers
- Depends on: Redux Toolkit, redux-persist, zustand, MMKV storage
- Used by: Components via hooks, business logic hooks

**Business Logic (Hooks):**
- Purpose: Encapsulate feature-specific logic: authentication, messaging, speech synthesis
- Location: `src/hooks/`
- Contains: Custom React hooks (useAuthFlow, useSendMessage, useSpeech, useGetPerson)
- Depends on: Zustand stores, React Query, native APIs
- Used by: Presentation layer (screens, components)

**Services (Infrastructure):**
- Purpose: Handle system-level concerns: asset caching, data transformation, intent parsing
- Location: `src/services/`
- Contains: Avatar bundle manager (offline caching), text-to-speech utilities, intent resolution, helper data
- Depends on: expo-file-system, Native WebView bridge
- Used by: Hooks and components for system operations

**Data Types & Constants:**
- Purpose: Define type contracts and application configuration
- Location: `src/types/`, `src/constants/`, `src/config.js`
- Contains: TypeScript types (chat, avatar), theme constants, API endpoints, feature flags
- Depends on: None (foundation layer)
- Used by: All other layers for type safety and configuration

**Web Runtime (Avatar Rendering):**
- Purpose: Render 3D avatar model, animate emotions, handle voice playback with lip-sync
- Location: `src/components/avatar/AvatarWebView.js`, `src/components/avatar/avatarBridge.js`, embedded web bundle
- Contains: WebView wrapper, message bridge (JS↔Native), bootstrap script for avatar selection
- Depends on: react-native-webview, WebView script injection
- Used by: Home screen to display avatar

## Data Flow

**Chat Message Cycle:**

1. User types message → TextInput updates → `setInput()` updates chatStore
2. User presses send → `sendMessage()` called
3. Add user message to chatStore → Display in chat UI
4. Call `useSendMessage` hook → Mutation function fetches CHAT_API_URL
5. Payload includes: current conversationHistory, user name, authentication status, selected avatar
6. API responds with: reply text, emotion, metadata
7. Add avatar reply to chatStore + speech queue
8. `useSpeech` hook detects new speech queue item
9. Fetch audio from SPEECH_SYNTHESIS_ENDPOINT with avatar/emotion/voice
10. Cache audio locally (MMKV)
11. Call WebView's `speakAudio()` method with audio payload
12. WebView animates avatar and plays audio
13. On speech complete, WebView dispatches "speech_finished" event
14. Hook advances speech queue → next item processes

**Avatar Selection Cycle:**

1. User opens avatar selector modal → `setIsSelectorOpen(true)`
2. User selects avatar from dropdown
3. `setSelectedAvatarId()` updates avatarStore
4. Component re-renders, passes new avatar name to AvatarWebView
5. WebView bootstrap script updates HTML select element
6. Three.js model reloads the new avatar's GLB file
7. Avatar background → Similar flow via `setSelectedBackgroundId()`
8. Emotion/mood → `setSelectedEmotionId()` calls WebView's `setMood()` method

**Authentication Flow:**

1. Chat step = "name" → User enters name
2. `handleNameMessage()` validates, sets guest name, advances to "intent" step
3. User sends request requiring authentication (e.g., "login")
4. API returns `type: "authentication"` with list of candidate users
5. Store candidate users, set chat step to "auth"
6. Ask first confirm question: "Are you [name] [lastName] from [city]?"
7. User responds "yes"/"no"
8. If "yes" → Ask next auth property question (favoriteColor, homeCountry, etc.)
9. Filter candidate users by matching responses
10. When 1 candidate remains → Call `useGetPerson` hook → Verify person
11. Set authenticated = true, advance to "intent" step
12. Continue conversation as authenticated user

**Asset Preloading (Background):**

1. App mounts → `_layout.tsx` warmup call to health endpoint
2. Parallel: AvatarWebView mounts → Check `isBundleCached()`
3. If not cached → Download CORE_FILES (HTML, JS, manifests, backgrounds) (~5 MB)
4. Save bundle version marker
5. Avatar renders with core bundle
6. Fire-and-forget: `preloadAllGlbs()` downloads avatar GLBs in background
7. On avatar selection → Check `isAvatarGlbCached()` for that avatar
8. If not cached → Download on-demand with progress callback
9. WebView loads GLB from local file URI (offline mode supported)

## Key Abstractions

**AvatarWebView:**
- Purpose: Bridge React Native and embedded Three.js avatar renderer
- Location: `src/components/avatar/AvatarWebView.js`
- Pattern: Ref-based imperative API + passive message event binding
- Methods: `setAvatar()`, `setBackground()`, `setMood()`, `speakAudio()`
- Events: "avatar_ready", "speech_finished", "avatar_error"
- Message bridge: `avatarBridge.js` encodes/decodes command and event payloads

**ChatStore (Zustand):**
- Purpose: Centralized chat and auth state, persistent conversation history
- Location: `src/stores/chatStore.ts`
- State: messages[], speechQueue[], conversationHistory[], chatStep, guestName, authenticated, person, users, authProperties, currentAuthProp
- Selectors: Subscription hooks for nested properties
- Actions: addMessage, addSpeechItem, advanceSpeechQueue, setChatStep, setAuthenticated, etc.

**AvatarStore (Zustand):**
- Purpose: Avatar customization state (selection, voice, emotion, background)
- Location: `src/stores/avatarStore.ts`
- State: avatarOptions[], selectedAvatarId, selectedVoiceId, selectedEmotionId, selectedBackgroundId, activeBgCategory, isSelectorOpen
- Persistence: selectedBackgroundId persisted to MMKV storage
- Computed: Selected avatar, voice, background lookups

**useSpeech Hook:**
- Purpose: Orchestrate text-to-speech synthesis, caching, and WebView playback
- Location: `src/hooks/useSpeech.ts`
- Pattern: Two useEffect hooks (active speech, prefetch next)
- Cache layer: localStorage/MMKV via `speechCache.ts`
- Handles: Speech deduplication, cancellation cleanup, error recovery

**useAuthFlow Hook:**
- Purpose: Multi-step authentication challenge-response logic
- Location: `src/hooks/useAuthFlow.ts`
- State: Questions asked (authProperties), current question (currentAuthProp), candidate users
- Logic: Filter users by response, advance to next property, verify person when done

**useSendMessage Hook:**
- Purpose: Wrap chat API in React Query mutation with conversation history sync
- Location: `src/hooks/useSendMessage.ts`
- Payload: Reads from stores (conversationHistory, guestName, person, srxState) at mutation time
- Updates: Persists updated history to store after response
- Error handling: Throws on HTTP error; caller handles display

## Entry Points

**App Root:**
- Location: `src/app/_layout.tsx`
- Triggers: App start, exposed via Expo Router as `/
- Responsibilities: 
  - Wrap app in QueryClientProvider (React Query)
  - Wrap in ThemeProvider (dark/light mode)
  - Render AnimatedSplashOverlay (loading state)
  - Fire health check request to warm TTS backend
  - Render Slot (Expo Router outlet for child routes)

**Home Screen:**
- Location: `src/app/index.tsx`
- Triggers: Default route (/) when app opens
- Responsibilities:
  - Render avatar panel with WebView
  - Manage chat scroll and keyboard interaction
  - Render message list and input bar
  - Render avatar selector modal
  - Orchestrate avatar lifecycle (hydrate options, set mood/avatar/background)
  - Dispatch messages to chat/auth/intent flows
  - Handle speech playback coordination

## Error Handling

**Strategy:** Multi-layer error recovery with graceful degradation

**Patterns:**

1. **Network errors:** Catch at hook level, return user-friendly message to avatar
   - `useSendMessage`: On fetch fail, throw error caught in HomeScreen `sendMessage`
   - Avatar displays: "I could not reach BOTCierge right now. Please try again."

2. **TTS synthesis errors:** `useSpeech` catches, logs, advances queue
   - If synthesis fails, speech queue advances; conversation continues
   - User doesn't see error, just no audio (graceful degrade)

3. **Asset loading errors:** Service layer (_avatarBundleManager_) silently retries
   - Missing core bundle → Download on demand during app use
   - Missing avatar GLB → Download when selected, reuse cached if available
   - Corrupt file detection: size < 50KB triggers re-download

4. **Authentication errors:** `useAuthFlow` catches exception, shows AUTH_FAILURE_PROMPT
   - User can re-attempt or register

5. **WebView bridge errors:** Bootstrap script wrapped in try-catch, no-ops on fail
   - Avatar selection falls back to default if mutation fails

## Cross-Cutting Concerns

**Logging:** 
- Minimal console output, mostly errors: `console.log('[hook-name][context]', error)`
- LogBox suppression in _layout.tsx (production setup)

**Validation:**
- Name validation: `/^[A-Za-z0-9' ]+\??$/` (alphanumeric, space, apostrophe, optional ?)
- Auth response filtering: Text matching against CandidateUser properties (case-insensitive contains)
- API response validation: Coerce to expected types, provide defaults (e.g., reply defaults to empty string)

**Authentication:**
- Multi-property challenge-response system (favoriteColor, homeCountry, homeState, mothersMaidenName)
- Stateful user filtering: Each answer narrows candidate list
- Session scoped: authenticated flag + person object, no token-based auth in chat API

**Offline Mode:**
- Core bundle cached locally (index.html, JS, backgrounds)
- Avatar GLBs cached lazily
- Chat messages stored in ChatStore (in-memory for session)
- Speech audio cached (MMKV storage)
- Health check call on app start (not blocking)

---

*Architecture analysis: 2026-07-03*
