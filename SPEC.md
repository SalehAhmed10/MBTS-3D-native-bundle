# BOTCierge Project Specification

## 1. Project Overview

**Name**: BOTCierge (Mobile Bypass The Server)  
**Type**: Mobile-first AI companion application  
**Platform**: Expo (React Native) for iOS/Android  
**Core Value**: Chat-based AI interaction with 3D animated avatars that process natural language intents

## 2. Business Goals

- Provide users with an engaging AI chat experience through personalized 3D avatars
- Enable natural language processing to understand user intents and respond appropriately
- Create a scalable avatar system supporting multiple AI personas
- Deliver real-time speech synthesis and animation synchronization

## 3. User Stories

### Primary User
- As a user, I want to select an AI avatar that matches my preference
- As a user, I want to send text messages and receive AI responses
- As a user, I want to hear the AI's response via text-to-speech
- As a user, I want to see the avatar animate while speaking
- As a user, I want to switch between different avatars seamlessly
- As a user, I want my chat history to persist across sessions

## 4. Functional Requirements

### FR-1: Avatar Selection & Rendering
- Display 12 unique AI avatars (Camilia, Benjamin, Dan, Candy, Debbie, Victoria, Prithi, Muhammad, Vanessa, John, Margie, Professor)
- Render avatars as 3D models using `react-native-filament`
- Support GLB model format for avatar assets
- Enable smooth avatar transitions and animations

### FR-2: Chat Interface
- Real-time text message display with user/bot distinction
- Message input with send capability
- Loading states and error handling for API calls
- Auto-scroll to latest message

### FR-3: AI Intent Processing
- Send user messages to MBTS API backend
- Receive structured AI responses with intent classification
- Handle multi-turn conversation context

### FR-4: Speech Synthesis
- Convert AI text responses to speech using Avatar Speech API
- Stream speech audio to native layer
- Synchronize avatar lip-sync with audio playback

### FR-5: Chat History & State
- Persist chat history using Redux Persist + MMKV encrypted storage
- Maintain separate chat sessions per avatar
- Restore previous conversation state on app launch

### FR-6: Navigation
- Tab-based navigation (Chat, Avatars, Settings)
- Deep linking support via Expo Router
- Native stack navigation for modal flows

## 5. Non-Functional Requirements

### NFR-1: Performance
- Avatar 3D rendering at 60fps on supported devices
- API response time < 2 seconds for chat messages
- Speech synthesis latency < 500ms

### NFR-2: Security
- All API keys stored in environment variables
- HTTPS-only API communication
- Encrypted local storage for chat history
- No hardcoded credentials in source code

### NFR-3: Offline Support
- Display cached chat history when offline
- Queue messages for sending when connectivity restored

### NFR-4: Platform Support
- iOS 15+ and Android API 24+
- Responsive layout for phones and tablets
- Adaptive UI for dark/light mode

## 6. API Contracts

### Main MBTS API (Heroku)
```json
POST /chat
Request: { message: string, userId: string, avatarId: string }
Response: { response: string, intent: string, confidence: number }
```

### Avatar Speech API (Staging Heroku)
```json
POST /speak
Request: { text: string, voice: string, avatarId: string }
Response: { audioUrl: string, duration: number }
```

## 7. Acceptance Criteria

### AC-1: Avatar Chat Flow
1. User opens app and sees avatar selection screen
2. User selects an avatar
3. User types "Hello" and sends
4. App displays user message immediately
5. App calls MBTS API and receives response
6. App calls Speech API and receives audio URL
7. Avatar animates while audio plays
8. Chat history is saved to local storage

### AC-2: Avatar Switching
1. User is in active chat with an avatar
2. User navigates to avatar selection
3. User selects different avatar
4. App loads new avatar 3D model
5. App loads chat history for new avatar
6. Previous chat remains accessible

### AC-3: Offline Behavior
1. User loses internet connection
2. App displays cached messages
3. User can still view previous conversations
4. New messages queue locally
5. Messages send automatically when connection restored

## 8. Technical Constraints

- Expo SDK 56 (versioned docs at https://docs.expo.dev/versions/v56.0.0/)
- React 19.2.3 with TypeScript strict mode
- No test suite currently configured
- Redux Toolkit for state management
- MMKV for encrypted storage

## 9. Out of Scope (v1)

- Voice input (speech-to-text)
- Multi-language support
- Avatar customization (clothing, accessories)
- Social features (sharing, friend requests)
- In-app purchases
