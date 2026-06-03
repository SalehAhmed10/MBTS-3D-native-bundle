import { Platform } from 'react-native';
import { avatarSpeechBaseURL, baseURL } from '../../utils/api';

export const SPEECH_PROVIDER_LOCAL_WEBVIEW = 'local-webview';
export const SPEECH_PROVIDER_SERVICE = 'service';

// Avatar speech runtime notes:
// - Production deployment uses service mode with hosted avatar page and backend.
// - Service mode requires a live backend speech endpoint.
// - Local-webview mode is only for development with local TTS server.
export const getSpeechProviderConfig = (platform = Platform.OS) => ({
  mode: SPEECH_PROVIDER_SERVICE,
  serviceUrl:
    platform === 'android' || platform === 'ios'
      ? `${avatarSpeechBaseURL}avatarSpeech/synthesize`
      : `${baseURL}avatarSpeech/synthesize`,
});
