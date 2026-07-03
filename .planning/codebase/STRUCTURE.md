# Codebase Structure

**Analysis Date:** 2026-07-03

## Directory Layout

```
mbts-3d-native-spike/
├── .planning/          # GSD orchestration files
├── android/            # Android native code (Gradle, manifests)
├── assets/             # App icons, backgrounds, splash screens
├── avatar-embed/       # Separate avatar web runtime (built separately)
├── docs/               # Documentation
├── plugins/            # Expo plugins (with-adjust-nothing)
├── scripts/            # Build scripts (reset-project, build-avatar-embed)
├── src/
│   ├── app/            # Expo Router navigation & screens
│   ├── assets/         # App-local images
│   ├── components/     # Reusable React Native components
│   ├── constants/      # Theme, hardcoded values
│   ├── data/           # Static data (avatar lists)
│   ├── hooks/          # Custom React hooks
│   ├── redux/          # Redux slices & store (legacy, unused in main flow)
│   ├── screens/        # Screen components (legacy, use app/ instead)
│   ├── services/       # Service utilities (bundle mgmt, API)
│   ├── stores/         # Zustand store definitions
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions & helpers
├── app.json            # Expo configuration
├── package.json        # Dependencies & scripts
└── tsconfig.json       # TypeScript configuration
```

## Directory Purposes

**src/app/:**
- Purpose: Expo Router file-based routing
- Contains: Root layout (_layout.tsx), home screen (index.tsx)
- Key files: `_layout.tsx` (providers), `index.tsx` (main UI)
- Pattern: Each .tsx file is a route; dynamic routes use [param] syntax
- NOTE: Currently has only root layout and index; consider migrating legacy screens/ here

**src/components/:**
- Purpose: Reusable UI components
- Contains: Avatar integration (avatar/), modals for various actions, theme components, UI primitives
- Subdirectories:
  - `avatar/` → AvatarWebView.js (3D avatar bridge), avatarBridge.js (message protocol), avatarSession.js (lifecycle), speechProvider.js (speech configuration)
  - `ui/` → collapsible.tsx (generic UI primitives)
  - `xshare/` → PostNeedForm.js (legacy feature)
- Pattern: Modular, self-contained; imports from stores and hooks as needed

**src/stores/:**
- Purpose: Zustand state store definitions
- Contains: Avatar settings, chat state, messages, speech queue
- Key files: `avatarStore.ts` (avatar selections + persistence), `chatStore.ts` (messages, auth state, conversation history)
- Pattern: Factory patterns creating hooks; stores manage their own setters

**src/hooks/:**
- Purpose: Custom React hooks encapsulating business logic
- Contains: Auth flow, speech synthesis, chat mutations, person verification
- Key files:
  - `useAuthFlow.ts` → Multi-step authentication challenge & verification
  - `useSendMessage.ts` → React Query mutation for chat API
  - `useSpeech.ts` → Speech synthesis orchestration with caching & prefetch
  - `useGetPerson.ts` → Identity verification API call
  - `use-color-scheme.ts` → Platform-specific theme detection
  - `use-theme.ts` → Theme provider hook
- Pattern: React hooks returning state, mutations, or callback functions

**src/types/:**
- Purpose: TypeScript type definitions
- Contains: Chat types, Avatar types
- Key files: `chat.ts` (ChatMessage, CandidateUser, AuthProperty, ChatStep), `avatar.ts` (AvatarOption, AvatarVoiceOption, AvatarEvent)
- Pattern: Exported type/interface definitions; no implementations

**src/services/:**
- Purpose: Business logic services for complex operations
- Contains: Avatar bundle management, API utilities
- Key files:
  - `avatarBundleManager.js` → Download, cache, and version avatar web runtime
  - `HelperData.js` → Legacy data structures (deprecated)
  - `intents.js` → Intent classification (legacy)
- Pattern: Pure functions or utilities; no class-based services

**src/utils/:**
- Purpose: General utility functions
- Contains: API config, storage, caching, data parsing
- Key files:
  - `api.js` → Centralized API endpoint URLs (MBTS_API_URL, AVATAR_SPEECH_API_URL)
  - `mmkv.js` → Encrypted persistent storage instance
  - `speechCache.ts` → File-system-based speech audio cache with hash-keyed lookup
  - `dateUtils.js` → Date manipulation helpers
  - `Activity.js` → Legacy activity tracking (unused)
- Pattern: Functional utilities; no state; single responsibility

**src/constants/:**
- Purpose: Hardcoded constants and theme definitions
- Contains: Theme colors, typography, spacing
- Key files: `theme.ts` → Color palette for light/dark modes

**src/data/:**
- Purpose: Static application data
- Contains: Avatar metadata and options
- Key files: `avatars.js` → Avatar definitions (name, id, default voice)

**src/redux/ & src/screens/:**
- Status: Legacy code
- Purpose: Redux-based state (superseded by Zustand); old screen definitions (superseded by Expo Router)
- Note: Not actively used in main flow; consider removing in future refactor

**app.json:**
- Purpose: Expo application configuration
- Contains: App name, version, icons, permissions, plugins, build settings
- Key sections: ios/android-specific settings, expo-router plugin, expo-splash-screen plugin

**assets/:**
- Purpose: Static assets (app icons, backgrounds, splash screens)
- Contains: PNG images for iOS, Android adaptive icons, avatar scene backgrounds

## Key File Locations

**Entry Points:**
- `src/app/_layout.tsx`: Root layout with QueryClient, ThemeProvider setup; health check for speech backend
- `src/app/index.tsx`: Main HomeScreen (1000+ lines); avatar panel, chat UI, input, settings modal
- `app.json`: Expo configuration read on app startup

**Configuration:**
- `src/config.js`: Centralized API URLs, feature flags (enableVoiceInput, enableOfflineMode, enableChatHistory)
- `src/utils/api.js`: Derived API URLs (baseURL, avatarSpeechBaseURL)

**Core Logic:**
- `src/stores/chatStore.ts`: Chat messages, conversation history, auth flow state
- `src/stores/avatarStore.ts`: Avatar selections, background, emotion, voice
- `src/hooks/useSendMessage.ts`: Chat API integration with conversation context
- `src/hooks/useAuthFlow.ts`: Multi-step identity verification logic
- `src/hooks/useSpeech.ts`: Speech synthesis pipeline with caching & prefetch

**Avatar/WebView:**
- `src/components/avatar/AvatarWebView.js`: React Native WebView bridge (forwardRef, lifecycle management)
- `src/components/avatar/avatarBridge.js`: Message protocol (payload building, URL construction)
- `src/services/avatarBundleManager.js`: Local bundle caching and download orchestration

**Styling:**
- Inline StyleSheet.create() in component files (no separate CSS modules)
- `src/constants/theme.ts`: Centralized color constants used throughout

**Testing:**
- No test files present in src/; no jest/vitest configuration

## Naming Conventions

**Files:**
- Component files: PascalCase.tsx (e.g., `AvatarWebView.js`, `ActivityLedgerModal.js`)
- Hook files: use{Name}.ts/tsx (e.g., `useAuthFlow.ts`, `useSpeech.ts`)
- Utility files: camelCase.js/ts (e.g., `speechCache.ts`, `dateUtils.js`)
- Type files: {type}.ts (e.g., `chat.ts`, `avatar.ts`)
- Store files: {name}Store.ts (e.g., `avatarStore.ts`, `chatStore.ts`)
- Test files (if added): {name}.test.ts or {name}.spec.ts

**Directories:**
- kebab-case: No, directories use camelCase or PascalCase
- Actual convention: camelCase for feature directories (app, components, hooks, stores, types, utils, services)
- Subdirectories: avatar (avatar-specific), ui (generic UI), xshare (legacy feature)

**Variables & Functions:**
- Functions: camelCase (e.g., `sendMessage()`, `handleAuthMessage()`)
- Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_AVATAR_ID`, `AUTH_PROPERTIES`)
- Zustand stores: camelCase with `use` prefix (e.g., `useAvatarStore`, `useChatStore`)
- Destructured state: camelCase (e.g., `{ avatarOptions, selectedAvatarId }`)

**CSS Classes/Styles:**
- StyleSheet keys: camelCase (e.g., `screen`, `chatScroller`, `messageRow`)
- No CSS class names (React Native uses inline StyleSheets)

## Where to Add New Code

**New Feature (end-to-end):**
1. **Type definitions**: Add to `src/types/` (e.g., `src/types/newFeature.ts`)
2. **State management**: Add to `src/stores/` if global (e.g., `src/stores/newFeatureStore.ts`)
3. **Business logic**: Add to `src/hooks/` (e.g., `src/hooks/useNewFeature.ts`)
4. **API integration**: Add fetch logic in hooks or services; update `src/config.js` for URLs
5. **UI components**: Add to `src/components/` (e.g., `src/components/NewFeatureModal.tsx`)
6. **Routing**: Add screen to `src/app/` using Expo Router file structure (e.g., `src/app/newFeature.tsx`)

**New Component/Module (isolated):**
- Implementation: `src/components/{name}.tsx` (if reusable) or inline in screen
- Styling: Use `StyleSheet.create()` inline or co-locate in same file
- Props: Define TypeScript interface at top of file (no separate .d.ts needed for simple components)

**Utilities:**
- Shared helpers: `src/utils/{name}.ts` (e.g., `src/utils/speechCache.ts`)
- Feature-specific utils: Co-locate in same directory as feature
- API endpoints: Add to `src/config.js`; derive URLs in `src/utils/api.js`

**Hooks:**
- Generic reusable logic: `src/hooks/use{Name}.ts`
- Complex state + effects: `src/hooks/use{Name}.ts` (follow React hooks conventions)
- Direct store access: Prefer hooks over direct `store.getState()` calls in components

**Types:**
- Global types: `src/types/{domain}.ts` (e.g., `src/types/chat.ts`)
- Component-local types: Define at top of component file (export if reused)
- API response types: Co-locate with hooks or in `src/types/`

## Special Directories

**Redux (src/redux/):**
- Purpose: Legacy Redux setup (slices, store configuration)
- Generated: No, manually maintained
- Committed: Yes
- Status: Superseded by Zustand; kept for backward compatibility
- Migration: Remove after confirming no active Redux subscribers

**Screens (src/screens/):**
- Purpose: Legacy screen components (old navigation structure)
- Generated: No
- Committed: Yes
- Status: Superseded by Expo Router (src/app/); consider migrating/removing
- Note: Old modals and screens still live here but are imported into app/index.tsx

**Avatar-embed (avatar-embed/ at root):**
- Purpose: Separate Vercel-deployed web runtime for 3D avatar
- Generated: Yes, built via `npm run build:avatar-embed`
- Committed: No, built separately; included in CI/CD
- Note: Contains Three.js 3D rendering, speech animation, avatar models (GLBs)

**Assets:**
- Purpose: App icons, splash screens, backgrounds
- Generated: No, manually curated
- Committed: Yes
- Structure: PNG images for iOS/Android/web; backgrounds in JPEG format (avatar scene backgrounds)

---

*Structure analysis: 2026-07-03*
