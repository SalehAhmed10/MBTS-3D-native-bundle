/**
 * Centralized application configuration.
 *
 * All URLs and feature flags should be defined here.
 * Environment variables are read with sensible production fallbacks.
 */

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

/** Main MBTS API backend. */
export const MBTS_API_URL =
  process.env.EXPO_PUBLIC_MBTS_API_URL ||
  "https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/";

/** Avatar speech synthesis backend (Heroku staging) */
export const AVATAR_SPEECH_API_URL =
  process.env.EXPO_PUBLIC_AVATAR_SPEECH_API_URL ||
  "https://mbts-3d-staging-a97d3e5c7d7c.herokuapp.com/";

/** Convenience: full speech synthesis endpoint path */
export const SPEECH_SYNTHESIS_ENDPOINT = `${AVATAR_SPEECH_API_URL}avatarSpeech/synthesize`;

/** Cheap health endpoint used to warm the Heroku dyno and TTS worker early. */
export const SPEECH_HEALTH_ENDPOINT = `${AVATAR_SPEECH_API_URL}avatarSpeech/health`;

// ---------------------------------------------------------------------------
// Avatar web view
// ---------------------------------------------------------------------------

/** Hosted avatar web page (Vercel deployment) */
export const AVATAR_WEB_VIEW_URL =
  process.env.EXPO_PUBLIC_AVATAR_WEB_VIEW_URL || "https://mbts-3-d-native-bundle.vercel.app/";

// ---------------------------------------------------------------------------
// Feature flags / toggles
// ---------------------------------------------------------------------------

export const FEATURES = {
  enableVoiceInput: false,
  enableOfflineMode: true,
  enableChatHistory: true,
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_AVATAR_ID = "camilia";
export const DEFAULT_SPEECH_TEXT =
  "Hello, I am Camille. What is your name?";
