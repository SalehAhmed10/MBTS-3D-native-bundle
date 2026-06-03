import { getSpeechProviderConfig } from './speechProvider';
import { AVATAR_WEB_VIEW_URL } from '@/config';

const AVATAR_NAME_MAP = {
  camilia: 'camilia',
  camille: 'camilia',
};

const AVATAR_ID_MAP = {
  camilia: 'Camilia',
  prithi: 'Prithi',
};

// Runtime contract:
// - Android WebView loads the bundled avatar page from native assets
// - iOS/Web load the hosted avatar page until they have their own bundle path
// - The avatar page decides its speech path from the speechMode query param
// - service mode requires a live backend speech endpoint
const hostedAvatarWebViewUrl = AVATAR_WEB_VIEW_URL;

export const defaultDevAvatarWebViewUrl = platform => hostedAvatarWebViewUrl;

export const bundledAvatarWebViewUrl = platform =>
  platform === 'android'
    ? 'file:///android_asset/avatar-web/index.html'
    : defaultDevAvatarWebViewUrl(platform);

export const defaultAvatarWebViewUrl = platform =>
  defaultDevAvatarWebViewUrl(platform);

export const buildAvatarWebViewUrl = (platform, baseUrl) => {
  const provider = getSpeechProviderConfig(platform);
  const url = new URL(baseUrl || defaultAvatarWebViewUrl(platform));
  url.searchParams.set('speechMode', provider.mode);
  url.searchParams.set('embed', '1');
  return url.toString();
};

export const normalizeAvatarName = avatarName => {
  const normalizedName = String(avatarName || 'prithi').trim().toLowerCase();
  return AVATAR_NAME_MAP[normalizedName] || normalizedName;
};

export const denormalizeAvatarName = avatarName => {
  const normalizedName = String(avatarName || 'prithi').trim().toLowerCase();
  return AVATAR_ID_MAP[normalizedName] || normalizedName;
};

export const buildAvatarBridgeMessage = payload => ({
  ...payload,
});

export const summarizeAvatarBridgePayload = payload => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  return {
    ...payload,
    audioBase64:
      typeof payload.audioBase64 === 'string'
        ? `[base64:${payload.audioBase64.length} chars]`
        : payload.audioBase64,
  };
};

export const buildAvatarInjection = payload =>
  `window.handleReactNativeMessage && window.handleReactNativeMessage(${JSON.stringify(
    payload,
  )}); true;`;

export const buildSpeechRequestFromMessage = (message, fallbackAvatar) => {
  if (!message || message.me || !message.message) {
    return null;
  }

  return {
    type: 'speak',
    text: message.message,
    mood: message.emotion || 'neutral',
    avatar: normalizeAvatarName(message.avatar || fallbackAvatar),
  };
};

export const buildAvatarSpeechEnvelope = (message, fallbackAvatar) => {
  const speechRequest = buildSpeechRequestFromMessage(message, fallbackAvatar);

  if (!speechRequest) {
    return null;
  }

  return {
    provider: getSpeechProviderConfig(),
    request: speechRequest,
  };
};
