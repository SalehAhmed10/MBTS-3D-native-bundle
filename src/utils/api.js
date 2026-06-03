import { AVATAR_SPEECH_API_URL, MBTS_API_URL } from '@/config';

// export const baseURL = 'http://10.0.2.2:5000/';

// export const baseURL = 'https://c4a3818f6dfc.ngrok-free.app/';

// export const baseURL = 'https://mbts.onrender.com/';

/** Main MBTS API base URL. */
export const baseURL = MBTS_API_URL;

/**
 * Avatar speech now runs from the deployed staging backend while the rest of
 * the app can continue using the existing MBTS API host.
 */
export const avatarSpeechBaseURL = AVATAR_SPEECH_API_URL;
