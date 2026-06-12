import { File, Paths } from "expo-file-system";

const CACHE_PREFIX = "tts-v1";

export type WebViewSpeechPayload = {
  audioBase64: string;
  words?: string[];
  wordTimes?: number[];
  wordDurations?: number[];
  visemes?: string[];
  visemeTimes?: number[];
  visemeDurations?: number[];
};

function hashKey(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function getCacheFile(
  text: string,
  avatarId: string,
  voiceId: string | null | undefined
): File {
  const key = `${text}|${avatarId}|${voiceId ?? ""}`;
  return new File(Paths.cache, `${CACHE_PREFIX}-${hashKey(key)}.json`);
}

export async function getCachedSpeech(
  text: string,
  avatarId: string,
  voiceId: string | null | undefined
): Promise<WebViewSpeechPayload | null> {
  try {
    const file = getCacheFile(text, avatarId, voiceId);
    if (!file.exists) return null;
    const payload = (await file.json()) as WebViewSpeechPayload;
    if (!payload?.audioBase64) return null;
    console.log("[speechCache] hit:", text.slice(0, 40));
    return payload;
  } catch {
    return null;
  }
}

export function cacheSpeech(
  text: string,
  avatarId: string,
  voiceId: string | null | undefined,
  payload: WebViewSpeechPayload
): void {
  try {
    const file = getCacheFile(text, avatarId, voiceId);
    if (file.exists) file.delete();
    file.create({ overwrite: true });
    file.write(JSON.stringify(payload));
  } catch (error) {
    console.log("[speechCache] write-error", error);
  }
}
