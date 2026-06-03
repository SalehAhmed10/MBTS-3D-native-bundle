import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { EncodingType, File, Paths } from "expo-file-system";
import { memo, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { FilamentPreview, type NativeAvatarId } from "@/components/filament-preview";
import { SPEECH_SYNTHESIS_ENDPOINT } from "@/config";
import { Spacing } from "@/constants/theme";
const SPEECH_CACHE_PREFIX = "avatar-speech-v1";
const DEFAULT_SPEECH_TEXT = "Hello, I am Prithi. This is native lipsync inside React Native.";
const RECENT_AUTOPLAY_WINDOW_MS = 4000;
const AUTO_PLAY_AFTER_READY_MS = 200;
const AUTO_PLAY_CACHED_FALLBACK_MS = 1200;
const recentAutoPlayMap = new Map<string, number>();

const MOODS = [
  { label: "Neutral", value: "neutral" },
  { label: "Be happy", value: "happy" },
  { label: "Be sad", value: "sad" },
  { label: "Be angry", value: "angry" },
  { label: "Be loving", value: "love" },
  { label: "Wink", value: "suggestive" },
] as const;

type SpeechResponse = {
  audioBase64: string;
  audioEncoding: "wav";
  visemes: string[];
  visemeTimes: number[];
  visemeDurations: number[];
};

type ResolvedSpeech = {
  fromCache: boolean;
  speech: SpeechResponse;
  synthMs: number;
};

type DemoState = "idle" | "loading" | "speaking" | "error";
type MoodName = (typeof MOODS)[number]["value"];

type MorphWeights = Record<string, number>;

type NativeAvatarSpeechProps = {
  autoPlayOnMount?: boolean;
  autoPlayText?: string;
  avatarId?: NativeAvatarId;
  backgroundColor?: string;
  backgroundImageSource?: ImageSourcePropType;
  displayName?: string;
  mood?: MoodName;
  initialMessage?: string;
  onSpeechError?: (text: string) => void;
  onSpeechFinished?: (text: string) => void;
  onSpeechStarted?: (text: string) => void;
  onSpeechPreparing?: (text: string) => void;
  speechRequestId?: string;
  speechText?: string;
  showControls?: boolean;
  showSpeechBubble?: boolean;
  style?: StyleProp<ViewStyle>;
};

type IdlePose = {
  translateY: number;
  rotateY: number;
  rotateZ: number;
};

type SkeletonPose = {
  bodyRotateX: number;
  bodyRotateY: number;
  bodyRotateZ: number;
  chestInhale: number;
  headRotateX: number;
  headRotateY: number;
  headRotateZ: number;
};

type VisemeCue = {
  name: string;
  start: number;
  end: number;
};

function hashSpeechText(text: string) {
  let hash = 5381;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

function getSpeechCacheFile(text: string) {
  return new File(Paths.cache, `${SPEECH_CACHE_PREFIX}-${hashSpeechText(text)}.json`);
}

async function readCachedSpeech(text: string) {
  try {
    const cacheFile = getSpeechCacheFile(text);

    if (!cacheFile.exists) {
      return null;
    }

    const speech = (await cacheFile.json()) as SpeechResponse;

    if (!speech?.audioBase64 || !Array.isArray(speech.visemes)) {
      return null;
    }

    return speech;
  } catch {
    return null;
  }
}

function writeCachedSpeech(text: string, speech: SpeechResponse) {
  try {
    const cacheFile = getSpeechCacheFile(text);

    if (cacheFile.exists) {
      cacheFile.delete();
    }

    cacheFile.create({ overwrite: true });
    cacheFile.write(JSON.stringify(speech));
  } catch (error) {
    console.log("[NativeAvatarSpeech] cache:write-error", error);
  }
}

function shouldSkipRecentAutoPlay(key: string) {
  const now = Date.now();
  const lastPlayedAt = recentAutoPlayMap.get(key) ?? 0;

  return now - lastPlayedAt < RECENT_AUTOPLAY_WINDOW_MS;
}

function markRecentAutoPlay(key: string) {
  recentAutoPlayMap.set(key, Date.now());
}

async function fetchSpeech(textToSpeak: string): Promise<ResolvedSpeech> {
  const startedAt = Date.now();
  const cachedSpeech = await readCachedSpeech(textToSpeak);

  if (cachedSpeech) {
    console.log("[NativeAvatarSpeech] cache:hit", textToSpeak);
    return {
      fromCache: true,
      speech: cachedSpeech,
      synthMs: Date.now() - startedAt,
    };
  }

  const response = await fetch(SPEECH_SYNTHESIS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: textToSpeak }),
  });

  if (!response.ok) {
    throw new Error(`TTS request failed with ${response.status}`);
  }

  const speech = (await response.json()) as SpeechResponse;
  const synthMs = Date.now() - startedAt;
  writeCachedSpeech(textToSpeak, speech);

  return {
    fromCache: false,
    speech,
    synthMs,
  };
}

function NativeAvatarSpeechComponent({
  autoPlayOnMount = false,
  autoPlayText,
  avatarId = "prithi",
  backgroundColor,
  backgroundImageSource,
  displayName,
  initialMessage = "Hello, I am Prithi. What is your name?",
  mood: moodProp = "neutral",
  onSpeechError,
  onSpeechFinished,
  onSpeechPreparing,
  onSpeechStarted,
  speechRequestId,
  speechText,
  showControls = true,
  showSpeechBubble = true,
  style,
}: NativeAvatarSpeechProps) {
  const [activeViseme, setActiveViseme] = useState<string | null>(null);
  const [morphWeights, setMorphWeights] = useState<MorphWeights>(() => createIdleMorphs());
  const [idlePose, setIdlePose] = useState<IdlePose>(() => createIdlePose(0));
  const [skeletonPose, setSkeletonPose] = useState<SkeletonPose>(() => createSkeletonPose(0, false));
  const [mood, setMood] = useState<MoodName>(moodProp);
  const [message, setMessage] = useState(initialMessage);
  const [lastAvatarMessage, setLastAvatarMessage] = useState(initialMessage);
  const [cachedAutoPlayReady, setCachedAutoPlayReady] = useState(false);
  const [winkStrength, setWinkStrength] = useState(0);
  const [state, setState] = useState<DemoState>("idle");
  const [status, setStatus] = useState("Ready");
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const playerRef = useRef<AudioPlayer | null>(null);
  const didAutoPlayRef = useRef(false);
  const lastSpokenTextRef = useRef<string | null>(null);
  const speechSerialRef = useRef(0);
  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlaySpeechRef = useRef<{ key: string; promise: Promise<ResolvedSpeech> } | null>(null);
  const cachedAutoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });

    return () => {
      clearVisemeTimers();
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
      if (cachedAutoPlayTimeoutRef.current) {
        clearTimeout(cachedAutoPlayTimeoutRef.current);
      }
      playerRef.current?.remove();
    };
  }, []);

  const clearVisemeTimers = () => {
    for (const timeout of timeoutsRef.current) {
      clearTimeout(timeout);
    }

    timeoutsRef.current = [];
    setActiveViseme(null);
    setMorphWeights(createIdleMorphs(0, mood, winkStrength));
  };

  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout> | null = null;

    const scheduleBlink = () => {
      blinkTimeout = setTimeout(() => {
        if (state !== "speaking") {
          runBlink(mood);
        }

        scheduleBlink();
      }, 2200 + Math.random() * 1800);
    };

    scheduleBlink();

    return () => {
      if (blinkTimeout) {
        clearTimeout(blinkTimeout);
      }
    };
  }, [state]);

  useEffect(() => {
    const startedAt = Date.now();
    const idleInterval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      setIdlePose(createIdlePose(elapsedSeconds));
      setSkeletonPose(createSkeletonPose(elapsedSeconds, state === "speaking"));

      if (state === "speaking") {
        return;
      }

      setMorphWeights((current) => ({
        ...current,
        ...createIdleMorphs(elapsedSeconds, mood, winkStrength),
      }));
    }, 80);

    return () => clearInterval(idleInterval);
  }, [mood, state, winkStrength]);

  const playSpeech = async (text = message, prefetchedSpeechPromise?: Promise<ResolvedSpeech>) => {
    const textToSpeak = text.trim() || DEFAULT_SPEECH_TEXT;
    const speechSerial = speechSerialRef.current + 1;
    speechSerialRef.current = speechSerial;

    try {
      clearVisemeTimers();
      playerRef.current?.remove();
      playerRef.current = null;
      setState("loading");
      setStatus("Preparing speech...");
      setLastAvatarMessage(textToSpeak);
      onSpeechPreparing?.(textToSpeak);
      console.log("[NativeAvatarSpeech] request:start", textToSpeak);

      setStatus("Calling staging TTS service...");
      const { speech, synthMs } = prefetchedSpeechPromise
        ? await prefetchedSpeechPromise
        : await fetchSpeech(textToSpeak);

      if (speechSerial !== speechSerialRef.current) {
        return;
      }

      console.log("[NativeAvatarSpeech] request:success", {
        synthMs,
        audioBase64Length: speech.audioBase64.length,
        visemeCount: speech.visemes.length,
        firstVisemes: speech.visemes.slice(0, 8),
      });

      const audioFile = new File(Paths.cache, "native-avatar-speech.wav");
      if (audioFile.exists) {
        audioFile.delete();
      }
      audioFile.create({ overwrite: true });
      audioFile.write(speech.audioBase64, { encoding: EncodingType.Base64 });
      console.log("[NativeAvatarSpeech] audio:file-ready", audioFile.uri);

      const player = createAudioPlayer(audioFile.uri, {
        keepAudioSessionActive: true,
        updateInterval: 50,
      });

      playerRef.current = player;
      animateVisemes(speech);
      setState("speaking");
      setStatus(`Speaking (${synthMs}ms TTS, ${speech.visemes.length} visemes).`);
      player.play();
      onSpeechStarted?.(textToSpeak);
      console.log("[NativeAvatarSpeech] audio:play");

      const finalVisemeTime = Math.max(
        0,
        ...speech.visemeTimes.map((time, index) => time + (speech.visemeDurations[index] || 80))
      );
      timeoutsRef.current.push(
        setTimeout(() => {
          if (speechSerial !== speechSerialRef.current) {
            return;
          }

          setState("idle");
          setStatus("Finished");
          setActiveViseme(null);
          setMorphWeights(createIdleMorphs(0, mood, winkStrength));
          onSpeechFinished?.(textToSpeak);
        }, finalVisemeTime + 250)
      );
    } catch (error) {
      if (speechSerial !== speechSerialRef.current) {
        return;
      }

      console.log("[NativeAvatarSpeech] error", error);
      clearVisemeTimers();
      setState("error");
      setStatus(error instanceof Error ? error.message : "Unknown native speech error");
      onSpeechError?.(textToSpeak);
    }
  };

  const animateVisemes = (speech: SpeechResponse) => {
    const cues: VisemeCue[] = speech.visemes.map((name, index) => ({
      name,
      start: speech.visemeTimes[index] ?? 0,
      end: (speech.visemeTimes[index] ?? 0) + (speech.visemeDurations[index] ?? 90),
    }));
    const startedAt = Date.now();
    const finalEnd = Math.max(0, ...cues.map((cue) => cue.end));
    let lastLoggedViseme: string | null = null;

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const nextWeights = createSpeechMorphs(cues, elapsed, mood, winkStrength);
      const strongest = getStrongestViseme(nextWeights);

      setMorphWeights(nextWeights);
      setActiveViseme(strongest);

      if (strongest && strongest !== lastLoggedViseme) {
        lastLoggedViseme = strongest;
        console.log("[NativeAvatarSpeech] viseme", strongest);
      }

      if (elapsed <= finalEnd + 160) {
        timeoutsRef.current.push(setTimeout(tick, 33));
      }
    };

    tick();
  };

  const runBlink = (currentMood: MoodName) => {
    setMorphWeights((current) => ({
      ...createIdleMorphs(0, currentMood, winkStrength),
      ...current,
      eyeBlinkLeft: 1,
      eyeBlinkRight: 1,
    }));

    timeoutsRef.current.push(
      setTimeout(() => {
        setMorphWeights(createIdleMorphs(0, currentMood, winkStrength));
      }, 110)
    );
  };

  const selectMood = (nextMood: MoodName) => {
    if (nextMood === "suggestive") {
      setMood("neutral");
      setWinkStrength(1);
      setStatus("Wink");
      timeoutsRef.current.push(
        setTimeout(() => {
          setWinkStrength(0);
          setStatus("Ready");
        }, 900)
      );
      return;
    }

    setMood(nextMood);
    setWinkStrength(0);
    setStatus(nextMood === "neutral" ? "Ready" : `Mood: ${nextMood}`);
  };

  const isBusy = state === "loading" || state === "speaking";

  useEffect(() => {
    setMood(moodProp);
    setWinkStrength(0);
  }, [moodProp]);

  useEffect(() => {
    if (!autoPlayOnMount || didAutoPlayRef.current) {
      return;
    }

    const textToSpeak = (autoPlayText || initialMessage).trim() || DEFAULT_SPEECH_TEXT;
    const autoPlayKey = `${avatarId}:${textToSpeak}`;

    if (shouldSkipRecentAutoPlay(autoPlayKey)) {
      return;
    }

    markRecentAutoPlay(autoPlayKey);
    const prefetchedSpeechPromise = fetchSpeech(textToSpeak);
    autoPlaySpeechRef.current = {
      key: autoPlayKey,
      promise: prefetchedSpeechPromise,
    };

    void prefetchedSpeechPromise.then((resolvedSpeech) => {
      if (!resolvedSpeech.fromCache) {
        return;
      }

      if (cachedAutoPlayTimeoutRef.current) {
        clearTimeout(cachedAutoPlayTimeoutRef.current);
      }

      cachedAutoPlayTimeoutRef.current = setTimeout(() => {
        setCachedAutoPlayReady(true);
        cachedAutoPlayTimeoutRef.current = null;
      }, AUTO_PLAY_CACHED_FALLBACK_MS);
    });
  }, [autoPlayOnMount, autoPlayText, avatarId, initialMessage]);

  useEffect(() => {
    const canAutoPlay = cachedAutoPlayReady;

    if (!autoPlayOnMount || didAutoPlayRef.current || !canAutoPlay) {
      return;
    }

    didAutoPlayRef.current = true;
    const textToSpeak = autoPlayText || initialMessage;
    const autoPlayKey = `${avatarId}:${textToSpeak}`;

    autoPlayTimeoutRef.current = setTimeout(() => {
      lastSpokenTextRef.current = textToSpeak;
      const prefetchedSpeechPromise =
        autoPlaySpeechRef.current?.key === autoPlayKey ? autoPlaySpeechRef.current.promise : undefined;

      void playSpeech(textToSpeak, prefetchedSpeechPromise);
      autoPlayTimeoutRef.current = null;
    }, AUTO_PLAY_AFTER_READY_MS);
  }, [autoPlayOnMount, autoPlayText, avatarId, cachedAutoPlayReady, initialMessage]);

  useEffect(() => {
    setCachedAutoPlayReady(false);
  }, [avatarId]);

  useEffect(() => {
    const textToSpeak = speechText?.trim();

    if (!textToSpeak || textToSpeak === lastSpokenTextRef.current) {
      return;
    }

    const speechKey = speechRequestId ? `${speechRequestId}:${textToSpeak}` : textToSpeak;

    if (speechKey === lastSpokenTextRef.current) {
      return;
    }

    lastSpokenTextRef.current = speechKey;
    void playSpeech(textToSpeak);
  }, [speechRequestId, speechText]);

  return (
    <View style={[styles.container, style]}>
      <FilamentPreview
        avatarId={avatarId}
        backgroundColor={backgroundColor}
        backgroundImageSource={backgroundImageSource}
        displayName={displayName}
        morphWeights={morphWeights}
        idlePose={idlePose}
        skeletonPose={skeletonPose}
      />

      {showControls ? (
        <View style={styles.emotionButtons}>
          {MOODS.map((item) => {
            const isActive = item.value === mood || (item.value === "suggestive" && winkStrength > 0);

            return (
              <Pressable key={item.value} accessibilityRole="button" onPress={() => selectMood(item.value)}>
                <Text allowFontScaling={false} style={[styles.emotionButton, isActive && styles.emotionButtonActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {showSpeechBubble ? (
        <View style={styles.chatArea}>
          <View style={styles.chatMessage}>
            <Text allowFontScaling={false} style={styles.avatarBubble}>{lastAvatarMessage}</Text>
            <Text allowFontScaling={false} style={styles.chatMeta}>
              {status} · {activeViseme ? `viseme_${activeViseme}` : mood}
            </Text>
          </View>
        </View>
      ) : null}

      {showControls ? (
        <View style={styles.inputBar}>
        <TextInput
          editable={!isBusy}
          onChangeText={setMessage}
          onSubmitEditing={() => void playSpeech()}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          returnKeyType="send"
          style={styles.textInput}
          value={message}
        />
        <Pressable
          accessibilityRole="button"
          disabled={isBusy}
          onPress={() => void playSpeech()}
          style={({ pressed }) => [styles.sendButton, (pressed || isBusy) && styles.buttonPressed]}
        >
          <Text allowFontScaling={false} style={styles.sendButtonText}>
            ➤
          </Text>
        </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export const NativeAvatarSpeech = memo(NativeAvatarSpeechComponent);

function createIdleMorphs(elapsedSeconds = 0, mood: MoodName = "neutral", winkStrength = 0): MorphWeights {
  const smilePulse = 0.04 * (1 + Math.sin(elapsedSeconds * 0.85)) * 0.5;
  const focusPulse = 0.02 * (1 + Math.sin(elapsedSeconds * 0.52 + 1.2)) * 0.5;
  const moodMorphs = createMoodMorphs(mood);

  return applyWinkMorphs(
    {
      ...moodMorphs,
      browInnerUp: Math.max(moodMorphs.browInnerUp ?? 0, 0.04 + focusPulse),
      cheekSquintLeft: Math.max(moodMorphs.cheekSquintLeft ?? 0, 0.035 + focusPulse),
      cheekSquintRight: Math.max(moodMorphs.cheekSquintRight ?? 0, 0.035 + focusPulse),
      eyeLookDownLeft: Math.max(moodMorphs.eyeLookDownLeft ?? 0, focusPulse),
      eyeLookDownRight: Math.max(moodMorphs.eyeLookDownRight ?? 0, focusPulse),
      mouthSmile: Math.max(moodMorphs.mouthSmile ?? 0, 0.08 + smilePulse),
      mouthSmileLeft: Math.max(moodMorphs.mouthSmileLeft ?? 0, 0.1 + smilePulse),
      mouthSmileRight: Math.max(moodMorphs.mouthSmileRight ?? 0, 0.1 + smilePulse),
    },
    winkStrength
  );
}

function createMoodMorphs(mood: MoodName): MorphWeights {
  switch (mood) {
    case "happy":
      return {
        browInnerUp: 0.3,
        cheekSquintLeft: 0.25,
        cheekSquintRight: 0.25,
        mouthSmile: 0.48,
        mouthSmileLeft: 0.48,
        mouthSmileRight: 0.48,
        noseSneerLeft: 0.18,
        noseSneerRight: 0.18,
      };
    case "sad":
      return {
        browInnerUp: 0.58,
        eyeLookDownLeft: 0.2,
        eyeLookDownRight: 0.2,
        mouthFrownLeft: 0.62,
        mouthFrownRight: 0.62,
        mouthPucker: 0.24,
        mouthRollLower: 0.18,
        mouthShrugLower: 0.22,
      };
    case "angry":
      return {
        browDownLeft: 0.72,
        browDownRight: 0.62,
        eyeLookUpLeft: 0.16,
        eyeLookUpRight: 0.16,
        jawForward: 0.24,
        mouthFrownLeft: 0.62,
        mouthFrownRight: 0.62,
        mouthPressLeft: 0.24,
        mouthPressRight: 0.24,
      };
    case "love":
      return {
        browInnerUp: 0.42,
        cheekSquintLeft: 0.35,
        cheekSquintRight: 0.35,
        eyeWideLeft: 0.26,
        eyeWideRight: 0.26,
        mouthSmile: 0.58,
        mouthSmileLeft: 0.56,
        mouthSmileRight: 0.56,
        noseSneerLeft: 0.2,
        noseSneerRight: 0.2,
      };
    case "suggestive":
    case "neutral":
    default:
      return {
        eyeLookDownLeft: 0.08,
        eyeLookDownRight: 0.08,
        mouthSmile: 0.16,
        mouthSmileLeft: 0.14,
        mouthSmileRight: 0.14,
      };
  }
}

function applyWinkMorphs(weights: MorphWeights, strength: number): MorphWeights {
  if (strength <= 0) {
    return weights;
  }

  return {
    ...weights,
    browDownLeft: Math.max(weights.browDownLeft ?? 0, 0.55 * strength),
    cheekSquintLeft: Math.max(weights.cheekSquintLeft ?? 0, 0.7 * strength),
    eyeBlinkLeft: Math.max(weights.eyeBlinkLeft ?? 0, 0.8 * strength),
    eyeSquintLeft: Math.max(weights.eyeSquintLeft ?? 0, 0.9 * strength),
    mouthOpen: Math.max(weights.mouthOpen ?? 0, 0.16 * strength),
    mouthSmile: Math.max(weights.mouthSmile ?? 0, 0.46 * strength),
    mouthSmileLeft: Math.max(weights.mouthSmileLeft ?? 0, 0.5 * strength),
  };
}

function createIdlePose(elapsedSeconds: number): IdlePose {
  return {
    translateY: Math.sin(elapsedSeconds * 1.2) * 0.012,
    rotateY: Math.sin(elapsedSeconds * 0.55) * 0.018,
    rotateZ: Math.sin(elapsedSeconds * 0.42 + 0.8) * 0.012,
  };
}

function createSkeletonPose(elapsedSeconds: number, speaking: boolean): SkeletonPose {
  const speechEnergy = speaking ? 1 : 0;

  return {
    bodyRotateX:
      Math.sin(elapsedSeconds * 0.84 + 0.35) * 0.018 +
      Math.sin(elapsedSeconds * 1.7) * 0.008 * speechEnergy,
    bodyRotateY:
      Math.sin(elapsedSeconds * 0.48) * 0.034 +
      Math.sin(elapsedSeconds * 2.2 + 0.5) * 0.018 * speechEnergy,
    bodyRotateZ:
      Math.sin(elapsedSeconds * 0.56 + 1.1) * 0.024 +
      Math.sin(elapsedSeconds * 2.8) * 0.012 * speechEnergy,
    chestInhale: 0.45 + 0.42 * (1 + Math.sin(elapsedSeconds * 1.9)) * 0.5,
    headRotateX:
      Math.sin(elapsedSeconds * 0.62 + 0.7) * 0.026 +
      Math.sin(elapsedSeconds * 3.1) * 0.024 * speechEnergy,
    headRotateY:
      Math.sin(elapsedSeconds * 0.5 + 1.2) * 0.048 +
      Math.sin(elapsedSeconds * 2.5) * 0.026 * speechEnergy,
    headRotateZ:
      Math.sin(elapsedSeconds * 0.7 + 2.1) * 0.025 +
      Math.sin(elapsedSeconds * 2.1 + 0.2) * 0.014 * speechEnergy,
  };
}

function createSpeechMorphs(cues: VisemeCue[], elapsedMs: number, mood: MoodName, winkStrength: number): MorphWeights {
  const weights: MorphWeights = {
    ...createIdleMorphs(0, mood, winkStrength),
    mouthOpen: 0.08,
  };

  for (const cue of cues) {
    const attack = 55;
    const release = 80;
    const influenceStart = cue.start - attack;
    const influenceEnd = cue.end + release;

    if (elapsedMs < influenceStart || elapsedMs > influenceEnd) {
      continue;
    }

    const envelope =
      elapsedMs < cue.start
        ? (elapsedMs - influenceStart) / attack
        : elapsedMs <= cue.end
          ? 1
          : 1 - (elapsedMs - cue.end) / release;
    const visemeWeight = (cue.name === "PP" || cue.name === "FF" ? 0.9 : 0.68) * clamp01(envelope);
    const key = `viseme_${cue.name}`;

    weights[key] = Math.max(weights[key] ?? 0, visemeWeight);
    weights.mouthOpen = Math.max(weights.mouthOpen ?? 0, visemeWeight * 0.28);
  }

  return weights;
}

function getStrongestViseme(weights: MorphWeights) {
  let strongest: string | null = null;
  let strongestWeight = 0;

  for (const [name, weight] of Object.entries(weights)) {
    if (!name.startsWith("viseme_") || weight <= strongestWeight) {
      continue;
    }

    strongest = name.replace("viseme_", "");
    strongestWeight = weight;
  }

  return strongestWeight > 0.05 ? strongest : null;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    flexGrow: 1,
    width: "100%",
  },
  emotionButtons: {
    backgroundColor: "#f9fafb",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emotionButton: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 16,
    borderWidth: 1,
    color: "#6b7280",
    fontSize: 12,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emotionButtonActive: {
    backgroundColor: "#6B4EAA",
    borderColor: "#6B4EAA",
    color: "#ffffff",
  },
  chatArea: {
    backgroundColor: "#ffffff",
    flex: 1,
    minHeight: 150,
    padding: 16,
  },
  chatMessage: {
    gap: 4,
  },
  avatarBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#6B4EAA",
    borderBottomLeftRadius: 4,
    borderRadius: 16,
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 21,
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatMeta: {
    color: "#9ca3af",
    fontSize: 12,
    marginLeft: 4,
  },
  inputBar: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderTopColor: "#e5e7eb",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    borderColor: "#e5e7eb",
    borderRadius: 24,
    borderWidth: 1,
    color: "#111827",
    flex: 1,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#6B4EAA",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    transform: [{ rotate: "-45deg" }],
  },
});
