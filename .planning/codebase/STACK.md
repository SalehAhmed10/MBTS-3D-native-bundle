# Technology Stack

**Analysis Date:** 2026-07-03

## Languages

**Primary:**
- TypeScript - Application logic (`.ts`, `.tsx` files throughout `src/`)
- JavaScript - Configuration and build scripts

**Secondary:**
- GLSL - Potential shader code for 3D rendering (via Filament)

## Runtime

**Environment:**
- Expo 56.0.8 - React Native development platform
- React Native 0.85.3 - Cross-platform mobile framework
- Node.js - Development environment

**Package Manager:**
- npm - Package management
- Lockfile: Present (`package-lock.json` 552.3KB)

## Frameworks

**Core:**
- React 19.2.3 - UI component library
- React DOM 19.2.3 - Web support
- Expo Router 56.2.7 - File-based routing system
- React Navigation 7.10.3 (drawer), 7.2.5 (native), 7.16.0 (native-stack) - Navigation framework

**State Management:**
- Redux 5.0.1 - State container
- @reduxjs/toolkit 2.12.0 - Redux utilities and setup
- Redux Persist 6.0.0 - State persistence
- Redux Thunk 3.1.0 - Async middleware
- Zustand 5.0.14 - Alternative lightweight state management (used in `src/stores/`)

**Data Fetching:**
- @tanstack/react-query 5.101.0 - Server state management
- axios 1.16.1 - HTTP client

**UI Components:**
- @rneui/base 5.0.0 - React Native Elements base components
- @rneui/themed 5.0.0 - Themed UI components

## Key Dependencies

**Critical:**
- react-native-reanimated 4.3.1 - High-performance animations (used in `src/components/animated-icon.tsx`)
- react-native-filament 1.11.0 - 3D rendering engine (avatar display)
- react-native-mmkv-storage 12.0.1 - Encrypted local storage (persistent client state)
- expo-file-system 56.0.7 - File operations for asset caching

**Gesture & Interaction:**
- react-native-gesture-handler 2.31.1 - Touch gesture handling
- react-native-reanimated worklets 0.8.3 & 1.6.3 - High-performance gesture worklets

**Media & Device APIs:**
- expo-audio 56.0.11 - Audio playback (speech synthesis)
- expo-image 56.0.9 - Optimized image rendering
- react-native-image-picker 8.2.1 - Image selection
- react-native-geolocation-service 5.3.1 - Location services
- react-native-permissions 5.5.2 - Permission management
- react-native-vector-icons 10.3.0 - Icon library (FontAwesome, Ionicons)

**Navigation & UI:**
- react-native-modal 14.0.0-rc.1 - Modal dialogs
- react-native-dropdown-picker 5.4.6 - Dropdown components
- react-native-element-dropdown 2.12.4 - Alternative dropdown
- react-native-numeric-input 1.9.1 - Number input component
- react-native-international-phone-number 0.11.6 - Phone input with country codes
- react-native-safe-area-context 5.7.0 - Safe area management
- react-native-screens 4.25.2 - Native screen components

**Utilities:**
- date-fns 4.3.0 - Date manipulation and formatting
- react-native-web 0.21.0 - React Native for web
- expo-web-browser 56.0.5 - Web browser integration
- expo-webview 13.16.1 - WebView for rendering web content

## Build & Development Tools

**Development:**
- TypeScript 6.0.3 - Type checking
- ESLint 9.0.0 - Code linting
- eslint-config-expo 56.0.4 - Expo linting rules

**Asset Processing:**
- @gltf-transform/cli 4.3.0 - GLTF file transformation
- @gltf-transform/functions 4.3.0 - GLTF utility functions
- draco3dgltf 1.5.7 - 3D mesh compression
- meshoptimizer 1.1.1 - Mesh optimization
- sharp 0.34.5 - Image processing
- three 0.184.0 - 3D library (utilities for tools)
- esbuild 0.28.0 - JavaScript bundler

**Transpilation:**
- babel-preset-expo - Babel preset for Expo
- react-native-reanimated/plugin - Babel plugin for worklets

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Extends: expo/tsconfig.base
- Path aliases:
  - `@/*` → `./src/*`
  - `@/assets/*` → `./assets/*`
- Strict mode enabled

**Build Configuration:**
- `app.json` - Expo configuration with platform-specific settings
- `metro.config.js` - Metro bundler (adds `.glb` asset support, excludes Filament spike assets)
- `babel.config.js` - Babel configuration with reanimated worklets plugin

**Linting:**
- `eslint.config.js` - ESLint flat config with Expo rules

**Environment:**
- `.env` - Local environment variables (not committed)
- `.env.example` - Template with required variables:
  - `EXPO_PUBLIC_MBTS_API_URL` - Main API endpoint
  - `EXPO_PUBLIC_AVATAR_SPEECH_API_URL` - Speech synthesis API
  - `EXPO_PUBLIC_AVATAR_WEB_VIEW_URL` - Avatar web view URL

## Scripts

```bash
npm start              # Start Expo development server
npm run android        # Build and run on Android
npm run ios            # Build and run on iOS
npm run web            # Run web version
npm run lint           # Run ESLint
npm run reset-project  # Reset project state
npm run build:avatar-embed  # Build avatar web bundle
npm run dev:avatar     # Serve avatar bundle locally on port 8090
```

## Platform Support

**Mobile:**
- iOS (Expo)
- Android (Expo)

**Web:**
- Static web build (Vercel deployment for avatar frontend)

**Experiments Enabled:**
- Typed Routes (`expo-router`)
- React Compiler optimization

---

*Stack analysis: 2026-07-03*
