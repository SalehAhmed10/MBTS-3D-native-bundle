# Technology Stack

**Analysis Date:** 2026-07-03

## Languages

**Primary:**
- TypeScript (18.0%) - Application source code in `src/**/*.ts` and `src/**/*.tsx`
- JavaScript (82.0%) - Configuration files, utilities, and legacy code
- React Native - Cross-platform mobile framework

**Secondary:**
- JSX/TSX - Component definitions
- CSS-in-JS - StyleSheet API and inline styling

## Runtime

**Environment:**
- React Native 0.85.3 - Core runtime
- Expo ~56.0.8 - Managed React Native framework
- Node.js (development only)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Expo Router ~56.2.7 - File-based routing and navigation
- React 19.2.3 - UI library
- React Native 0.85.3 - Native runtime

**State Management:**
- Zustand 5.0.14 - Light-weight state management for avatar and chat stores (`src/stores/avatarStore.ts`, `src/stores/chatStore.ts`)
- Redux Toolkit 2.12.0 - Structured state management (configured but primary stores use Zustand)
- Redux 5.0.1 - Core Redux
- React-Redux 9.3.0 - React bindings
- Redux Persist 6.0.0 - State persistence
- Redux Thunk 3.1.0 - Async middleware

**Navigation:**
- React Navigation Native 7.2.5 - Cross-platform navigation
- React Navigation Native Stack 7.16.0 - Stack-based navigation
- React Navigation Drawer 7.10.3 - Drawer navigation

**Data Fetching & Queries:**
- TanStack React Query 5.101.0 - Server state management for API calls (`src/hooks/useSendMessage.ts`, `src/hooks/useGetPerson.ts`, `src/hooks/useSpeech.ts`)
- Axios 1.16.1 - HTTP client (configured but fetch API used directly)

**Animation & UI:**
- React Native Reanimated 4.3.1 - Performance-optimized animations
- React Native Worklets 0.8.3 - High-performance code execution
- React Native Worklets Core 1.6.3 - Worklet infrastructure

**Testing:**
- Not configured - No test framework detected (no jest.config.js, vitest.config.js)

**Build/Dev:**
- Babel ~56.0.x with `babel-preset-expo` - JS transformation
- Metro (~0.x) - React Native bundler (via Expo)
- ESLint 9.0.0 - Linting with `eslint-config-expo` ~56.0.4
- TypeScript ~6.0.3 - Type checking
- Three.js 0.184.0 (dev) - 3D graphics library
- @gltf-transform/cli 4.3.0 - GLB model processing
- @gltf-transform/functions 4.3.0 - GLB transformation functions
- Draco3dGLTF 1.5.7 - 3D model compression
- Meshoptimizer 1.1.1 - Mesh optimization
- Sharp 0.34.5 - Image processing

## Key Dependencies

**Critical UI Components:**
- @react-native-community/datetimepicker 9.1.0 - Date/time picker widget
- @rneui/base 5.0.0 - React Native Elements base components
- @rneui/themed 5.0.0 - Themed React Native Elements components
- React Native Vector Icons 10.3.0 - Icon library
- React Native Element Dropdown 2.12.4 - Dropdown selector
- React Native Dropdown Picker 5.4.6 - Alternative dropdown
- React Native Modal 14.0.0-rc.1 - Modal dialogs
- React Native Numeric Input 1.9.1 - Numeric input widget

**Platform & Device:**
- Expo Audio ~56.0.11 - Audio playback/recording
- Expo Constants ~56.0.16 - App constants and metadata
- Expo Device ~56.0.4 - Device information
- Expo File System ~56.0.7 - File I/O (used for speech cache in `src/utils/speechCache.ts`)
- Expo Font ~56.0.5 - Custom font loading
- Expo Glass Effect ~56.0.4 - Glass morphism effects
- Expo Image ~56.0.9 - Optimized image component
- Expo Linking ~56.0.12 - Deep linking
- Expo Splash Screen ~56.0.10 - Splash screen configuration
- Expo Status Bar ~56.0.4 - Status bar control
- Expo Symbols ~56.0.5 - SF Symbols support
- Expo System UI ~56.0.5 - System UI customization
- Expo Web Browser ~56.0.5 - Web browser launcher
- React Native Safe Area Context ~5.7.0 - Safe area handling
- React Native Screens 4.25.2 - Native screen component
- React Native Gesture Handler ~2.31.1 - Touch gesture handling
- React Native Permissions 5.5.2 - Permission requests
- React Native Geolocation Service 5.3.1 - GPS/location services
- React Native Image Picker 8.2.1 - Camera/gallery selection
- React Native WebView 13.16.1 - Embedded web view (`src/components/avatar/AvatarWebView`)
- React Native International Phone Number 0.11.6 - Phone input formatting

**3D & Graphics:**
- React Native Filament 1.11.0 - Filament 3D rendering engine (noted as spike code)
- Three.js 0.184.0 - 3D library for web components

**Storage & Caching:**
- React Native MMKV Storage 12.0.1 - Encrypted local storage (`src/utils/mmkv.js`)
- Expo File System - Speech synthesis cache (`src/utils/speechCache.ts`)

**Utilities:**
- Date-fns 4.3.0 - Date manipulation
- @expo/ui ~56.0.14 - Expo UI utilities
- React Native Web ~0.21.0 - Web support for React Native

## Configuration

**Environment Variables:**
All configured via `EXPO_PUBLIC_*` prefix (Expo public variable convention):
- `EXPO_PUBLIC_MBTS_API_URL` - Main backend API base URL (defaults to `https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/`)
- `EXPO_PUBLIC_AVATAR_SPEECH_API_URL` - TTS backend URL (defaults to staging Heroku URL)
- `EXPO_PUBLIC_AVATAR_WEB_VIEW_URL` - Avatar web view URL (defaults to `https://mbts3d-avatar.vercel.app/`)

**Configuration Files:**
- `tsconfig.json` - TypeScript config with path aliases (`@/*` → `src/*`, `@/assets/*` → `assets/*`)
- `babel.config.js` - Babel preset Expo + React Native Reanimated plugin
- `metro.config.js` - Metro bundler config with GLB asset support
- `eslint.config.js` - ESLint with Expo flat config
- `src/config.js` - Centralized app configuration (API URLs, feature flags, defaults)

**Build Scripts:**
- `start` - Start Expo development server
- `android` - Build and run on Android emulator/device
- `ios` - Build and run on iOS simulator/device
- `web` - Start web version
- `lint` - Run ESLint
- `build:avatar-embed` - Build embedded avatar web bundle
- `dev:avatar` - Serve avatar bundle locally on port 8090

## Platform Requirements

**Development:**
- Node.js and npm
- Expo CLI (via `expo start`)
- Platform-specific requirements:
  - iOS: Xcode + Cocoapods
  - Android: Android SDK + Android Studio
  - Web: None (served via Metro web)

**Production:**
- Deployment: Expo Application Services (EAS) or standalone builds
- Avatar WebView hosted on Vercel
- Backend APIs on Heroku (staging) and custom domains (production)
- TTS and chat APIs accessible over HTTPS

**Asset Pipeline:**
- GLB models processed via gltf-transform (Draco compression, WebP textures)
- Images optimized via Sharp
- Models excluded from Metro bundle via blockList in `metro.config.js`
- Speech synthesis results cached locally via Expo File System

---

*Stack analysis: 2026-07-03*
