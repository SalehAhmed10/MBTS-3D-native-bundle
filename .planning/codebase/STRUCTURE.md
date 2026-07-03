# Codebase Structure

**Analysis Date:** 2026-07-03

## Directory Layout

```
project-root/
├── src/                           # Application source code
│   ├── app/                       # Expo Router entry points (file-based routing)
│   ├── assets/                    # Static images and media
│   ├── components/                # Reusable UI components
│   ├── constants/                 # App-wide theme and constants
│   ├── data/                      # Static data (avatars manifest)
│   ├── hooks/                     # Custom React hooks
│   ├── redux/                     # Redux store (legacy persistence)
│   ├── screens/                   # Screen components (legacy folder, unused)
│   ├── services/                  # Infrastructure services
│   ├── stores/                    # Zustand state stores
│   ├── types/                     # TypeScript type definitions
│   ├── utils/                     # Utility functions
│   ├── config.js                  # Centralized configuration
│   └── global.css                 # Global styles
├── assets/                        # Public assets (compiled avatar backgrounds)
├── android/                       # Android native code
├── ios/                           # iOS native code
├── .planning/                     # Project planning (GSD workflow)
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── app.json                       # Expo app configuration
└── eslintrc                       # Linting rules
```

## Directory Purposes

**src/app/**
- Purpose: Expo Router entry points and layout composition
- Contains: Route definitions (file-based), layout wrappers, provider setup
- Key files:
  - `_layout.tsx`: Root layout with QueryClientProvider, ThemeProvider, splash overlay
  - `index.tsx`: Default route (/) - main home screen with avatar and chat

**src/assets/**
- Purpose: Static image assets used in the app
- Contains: PNG/JPG files for avatar backgrounds, icons
- Structure:
  - `avatar-backgrounds/`: Background images (bg1.jpg, bg_dubai.jpg, etc.)
  - `images/`: App icons and logos

**src/components/**
- Purpose: Reusable UI components organized by feature
- Key subdirectories:
  - `avatar/`: Avatar WebView and bridge components (AvatarWebView.js, avatarBridge.js, speechProvider.js)
  - `ui/`: Shared UI elements (collapsible.tsx)
  - `xshare/`: Legacy share feature components
- Key files:
  - Modal components: `AddPhoneNumberModal.js`, `ScheduleModal.js`, `ViewTodoListModal.js`, etc.
  - Themed components: `themed-text.tsx`, `themed-view.tsx`
  - Animation component: `animated-icon.tsx` (web variant: `animated-icon.web.tsx`)
  - App tabs: `app-tabs.tsx` (web variant: `app-tabs.web.tsx`)

**src/constants/**
- Purpose: App-wide constants and theme configuration
- Key files:
  - `theme.ts`: Color palette, typography, spacing constants

**src/data/**
- Purpose: Static data files (manifests, lookups)
- Key files:
  - `avatars.js`: Avatar metadata and configuration

**src/hooks/**
- Purpose: Custom React hooks encapsulating feature logic
- Key files:
  - `useAuthFlow.ts`: Authentication challenge-response logic
  - `useGetPerson.ts`: Fetch verified person from backend
  - `useSendMessage.ts`: Chat API mutation (React Query)
  - `useSpeech.ts`: Text-to-speech orchestration
  - `use-color-scheme.ts`: Platform color scheme detection
  - `use-theme.ts`: Theme context hook

**src/redux/**
- Purpose: Redux store for persistent user data (legacy, being phased out)
- Contains: Redux Toolkit store configuration, slices, reducers, MMKV storage adapter
- Key files:
  - `store/store.js`: Store initialization with redux-persist
  - `slices/personSlice.js`: User person data reducer
  - `slices/postSlice.js`: Post/activity data reducer
  - `slices/xShareSlice.js`: Share feature reducer
  - `reducers/rootReducer.js`: Combined reducer
  - `storage/storage.js`: MMKV storage adapter for persistence

**src/screens/**
- Purpose: Legacy screen components (not actively used in current app)
- Status: Mostly replaced by Expo Router routes in `src/app/`

**src/services/**
- Purpose: Infrastructure services for system-level operations
- Key files:
  - `avatarBundleManager.js`: Download/cache avatar web bundle and GLBs
    - Functions: `downloadCoreBundle()`, `downloadAvatarGlb()`, `isAvatarGlbCached()`, `preloadAllGlbs()`, `clearBundle()`
    - Caching: Uses expo-file-system to store bundles locally
  - `HelperData.js`: Data transformation and helper utilities
  - `intents.js`: Intent parsing logic

**src/stores/**
- Purpose: Zustand state management stores for reactive UI state
- Key files:
  - `avatarStore.ts`: Avatar selection state (avatar ID, voice, emotion, background, selector visibility)
  - `chatStore.ts`: Chat and authentication state (messages, speech queue, conversation history, guest name, auth flow)

**src/types/**
- Purpose: TypeScript type definitions and interfaces
- Key files:
  - `avatar.ts`: AvatarOption, AvatarVoiceOption, AvatarRuntimeDescriptor, AvatarEvent types
  - `chat.ts`: ChatMessage, ChatApiResponse, CandidateUser, AuthProperty, ChatStep types
  - `assets.d.ts`: Asset module declarations (image requires)

**src/utils/**
- Purpose: Utility functions and helpers
- Key files:
  - `mmkv.js`: MMKV storage adapter for Zustand persistence
  - `speechCache.ts`: Caching layer for text-to-speech audio payloads

**src/config.js**
- Purpose: Centralized configuration and environment variables
- Contains:
  - API endpoints: `MBTS_API_URL`, `AVATAR_SPEECH_API_URL`, `AVATAR_WEB_VIEW_URL`
  - Derived endpoints: `SPEECH_SYNTHESIS_ENDPOINT`, `SPEECH_HEALTH_ENDPOINT`
  - Feature flags: `enableVoiceInput`, `enableOfflineMode`, `enableChatHistory`
  - Defaults: `DEFAULT_AVATAR_ID`, `DEFAULT_SPEECH_TEXT`

## Key File Locations

**Entry Points:**
- `src/app/_layout.tsx`: App root with providers
- `src/app/index.tsx`: Main home screen (default route /)

**Configuration:**
- `src/config.js`: API endpoints and feature flags
- `app.json`: Expo app metadata and build config
- `tsconfig.json`: TypeScript compiler options
- `package.json`: Dependencies and scripts

**Core Logic:**
- `src/hooks/useSendMessage.ts`: Chat API integration
- `src/hooks/useAuthFlow.ts`: Authentication flow
- `src/hooks/useSpeech.ts`: Text-to-speech synthesis
- `src/services/avatarBundleManager.js`: Asset caching and offline support

**State Management:**
- `src/stores/avatarStore.ts`: Avatar UI state (Zustand)
- `src/stores/chatStore.ts`: Chat and auth state (Zustand)
- `src/redux/store/store.js`: Redux store setup (legacy persistence)

**Testing:**
- Test files are co-located with source files (not detected in current codebase)
- No test configuration found (jest.config or vitest.config)

## Naming Conventions

**Files:**
- React components: PascalCase (e.g., `AddPhoneNumberModal.js`, `AvatarWebView.js`)
- Hooks: camelCase with `use` prefix (e.g., `useSendMessage.ts`, `useAuthFlow.ts`)
- Utilities: camelCase (e.g., `speechCache.ts`, `mmkv.js`)
- Types: PascalCase for type/interface names (e.g., `ChatMessage`, `AvatarOption`)
- Config/constants: camelCase (e.g., `config.js`, `theme.ts`)

**Directories:**
- Feature folders: kebab-case or camelCase (e.g., `avatar/`, `xshare/`)
- Feature groups: camelCase plural (e.g., `components/`, `hooks/`, `stores/`, `services/`)

**Components (internal naming):**
- Exports: Export default for screen/page components, named exports for utility components
- Styles: `StyleSheet.create()` with object key pattern (e.g., `styles.screen`, `styles.inputBar`)
- Props types: Define inline in component file or import from `types/` directory

## Where to Add New Code

**New Feature (requires chat interaction, avatar response):**
- API hook: `src/hooks/use[Feature].ts` - React Query mutation or custom logic
- Store updates: Add to `src/stores/chatStore.ts` if affects chat/auth state
- Type definitions: `src/types/chat.ts` for new response types
- Home screen integration: Update `src/app/index.tsx` to handle new feature in message send flow

**New Component/Modal (UI feature):**
- Implementation: `src/components/[FeatureName]Modal.js` (if modal) or `src/components/[FeatureName].tsx`
- Use case: Modal components for capture form, display options, view details
- Pattern: Controlled via Zustand store (visibility flag) or parent props
- Styling: StyleSheet.create() at file bottom

**New Avatar State (selection option, animation):**
- Store action: `src/stores/avatarStore.ts` - add state field + setter
- WebView bridge: `src/components/avatar/avatarBridge.js` - encode command if needed
- Home screen: `src/app/index.tsx` - wire up selector dropdown or control
- Type: `src/types/avatar.ts` - update AvatarOption or AvatarStore interface

**New Utility/Service:**
- Shared utilities: `src/utils/[utility].ts` - functions for data transformation, caching, etc.
- System services: `src/services/[service].js` - file I/O, network, native bridge operations
- Import path: Use path alias `@/` (configured in tsconfig.json)

**New Screen/Route:**
- File: `src/app/[routeName]/index.tsx` (Expo Router file-based convention)
- Layout: `src/app/[routeName]/_layout.tsx` (if needs nested routing)
- Provider: Ensure wrapped by `_layout.tsx` providers (QueryClientProvider, ThemeProvider)

## Special Directories

**node_modules/**
- Purpose: Installed dependencies
- Generated: Yes (via `npm install` or `npm ci`)
- Committed: No (gitignored)

**android/, ios/**
- Purpose: Platform-specific native code and build artifacts
- Generated: Android: compiled from Gradle, iOS: compiled from Xcode
- Committed: Partially (source files committed, build artifacts gitignored)

**.expo/**
- Purpose: Expo CLI cache and metadata
- Generated: Yes (created by `expo start`, `expo run:android`, `expo run:ios`)
- Committed: No (gitignored)

**.planning/codebase/**
- Purpose: GSD workflow documentation (architecture, structure, concerns)
- Generated: No (manually created by GSD tools)
- Committed: Yes (reference documents for future phases)

**.planning/phases/**
- Purpose: Implementation phase plans (sprint tasks, checklist)
- Generated: No (created by `/gsd-plan-phase`)
- Committed: Yes (reference for tracking implementation progress)

---

*Structure analysis: 2026-07-03*
