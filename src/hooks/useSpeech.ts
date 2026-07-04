import { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { SPEECH_SYNTHESIS_ENDPOINT } from '@/config';
import { cacheSpeech, getCachedSpeech, type WebViewSpeechPayload } from '@/utils/speechCache';
import type { AvatarOption, AvatarVoiceOption } from '@/types/avatar';

interface AvatarWebViewRef {
  speakAudio: (payload: Record<string, unknown>) => void;
}

interface UseSpeechParams {
  avatarWebViewRef: React.RefObject<AvatarWebViewRef | null>;
  selectedAvatar: AvatarOption;
  selectedEmotionId: string;
  selectedVoice: AvatarVoiceOption | null;
}

export function useSpeech({
  avatarWebViewRef,
  selectedAvatar,
  selectedEmotionId,
  selectedVoice,
}: UseSpeechParams) {
  const speechQueue = useChatStore((s) => s.speechQueue);
  const advanceSpeechQueue = useChatStore((s) => s.advanceSpeechQueue);

  const activeSpeech = speechQueue[0] ?? null;
  const nextSpeech = speechQueue[1] ?? null;
  const lastDispatchedRef = useRef<string | null>(null);

  // Synthesize and play active speech item.
  useEffect(() => {
    if (!activeSpeech?.text) return;
    if (lastDispatchedRef.current === activeSpeech.id) return;

    lastDispatchedRef.current = activeSpeech.id;
    let cancelled = false;

    const run = async () => {
      try {
        const cached = await getCachedSpeech(activeSpeech.text, selectedAvatar.id, selectedVoice?.id);
        let payload: WebViewSpeechPayload | null = cached;

        if (!payload) {
          const res = await fetch(SPEECH_SYNTHESIS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: activeSpeech.text,
              avatar: selectedAvatar.id,
              mood: selectedEmotionId,
              voiceId: selectedVoice?.id,
              voiceLabel: selectedVoice?.label,
            }),
          });

          const data = await res.json().catch(() => ({})) as WebViewSpeechPayload;
          if (!res.ok) throw new Error(`TTS failed with ${res.status}`);
          payload = data;
          cacheSpeech(activeSpeech.text, selectedAvatar.id, selectedVoice?.id, data);
        }

        if (cancelled) return;

        avatarWebViewRef.current?.speakAudio({
          text: activeSpeech.text,
          avatar: selectedAvatar.label,
          mood: selectedEmotionId,
          voiceId: selectedVoice?.id,
          voiceLabel: selectedVoice?.label,
          audioBase64: payload!.audioBase64,
          words: payload!.words,
          wordTimes: payload!.wordTimes,
          wordDurations: payload!.wordDurations,
          visemes: payload!.visemes,
          visemeTimes: payload!.visemeTimes,
          visemeDurations: payload!.visemeDurations,
        });
      } catch (err) {
        if (cancelled) return;
        console.log('[useSpeech][error]', err);
        lastDispatchedRef.current = null;
        advanceSpeechQueue();
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [
    activeSpeech?.id,
    activeSpeech?.text,
    advanceSpeechQueue,
    avatarWebViewRef,
    selectedAvatar.id,
    selectedAvatar.label,
    selectedEmotionId,
    selectedVoice?.id,
    selectedVoice?.label,
  ]);

  // Prefetch next speech item while current plays.
  useEffect(() => {
    if (!nextSpeech?.text) return;
    let cancelled = false;

    const prefetch = async () => {
      const cached = await getCachedSpeech(nextSpeech.text, selectedAvatar.id, selectedVoice?.id);
      if (cached || cancelled) return;

      try {
        const res = await fetch(SPEECH_SYNTHESIS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: nextSpeech.text,
            avatar: selectedAvatar.id,
            mood: selectedEmotionId,
            voiceId: selectedVoice?.id,
            voiceLabel: selectedVoice?.label,
          }),
        });
        if (!res.ok || cancelled) return;
        const payload = await res.json().catch(() => null) as WebViewSpeechPayload | null;
        if (payload && !cancelled) {
          cacheSpeech(nextSpeech.text, selectedAvatar.id, selectedVoice?.id, payload);
        }
      } catch {
        // best-effort prefetch, ignore errors
      }
    };

    void prefetch();
    return () => { cancelled = true; };
  }, [
    nextSpeech?.id,
    nextSpeech?.text,
    selectedAvatar.id,
    selectedEmotionId,
    selectedVoice?.id,
    selectedVoice?.label,
  ]);

  return {
    isPlaying: speechQueue.length > 0,
  };
}
