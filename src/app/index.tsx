import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AvatarWebView from "@/components/avatar/AvatarWebView";
import { SPEECH_SYNTHESIS_ENDPOINT } from "@/config";
import { baseURL } from "@/utils/api";
import { cacheSpeech, getCachedSpeech } from "@/utils/speechCache";

type AvatarVoiceOption = {
  id: string;
  label: string;
};

type AvatarOption = {
  id: string;
  label: string;
  available: boolean;
  voice?: AvatarVoiceOption | null;
  voices?: AvatarVoiceOption[];
  defaultVoiceId?: string | null;
};

type AvatarRuntimeDescriptor = {
  id?: string;
  label?: string;
  voice?: AvatarVoiceOption | null;
  voices?: AvatarVoiceOption[] | null;
  defaultVoiceId?: string | null;
};

type AvatarEvent = {
  type?: string;
  supportedAvatars?: AvatarRuntimeDescriptor[];
};

const DEFAULT_AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: "prithi",
    label: "Prithi",
    available: true,
    voice: {
      id: "prithi-default",
      label: "Prithi Default",
    },
    voices: [
      {
        id: "prithi-default",
        label: "Prithi Default",
      },
    ],
    defaultVoiceId: "prithi-default",
  },
  {
    id: "camilia",
    label: "Camilia",
    available: true,
    voice: {
      id: "camilia-default",
      label: "Camilia Default",
    },
    voices: [
      {
        id: "camilia-default",
        label: "Camilia Default",
      },
    ],
    defaultVoiceId: "camilia-default",
  },
];

const DEFAULT_AVATAR_ID = "prithi";

const buildHelloMessage = (avatarName: string) =>
  `Hello, I'm ${avatarName}. What's your name?\nPlease enter it below.`;

const EMOTION_OPTIONS = [
  { id: "neutral", label: "Neutral" },
  { id: "happy", label: "Happy" },
  { id: "sad", label: "Sad" },
  { id: "angry", label: "Angry" },
  { id: "suggestive", label: "Suggestive" },
  { id: "love", label: "Love" },
] as const;

const BACKGROUND_OPTIONS = [
  {
    id: "none",
    label: "None",
    color: "#ffffff",
    source: undefined,
  },
  {
    id: "bg1.jpg",
    label: "bg1",
    color: "#f4f0ff",
    source: require("../../assets/avatar-backgrounds/bg1.jpg"),
  },
  {
    id: "bg2.jpg",
    label: "bg2",
    color: "#eef7ff",
    source: require("../../assets/avatar-backgrounds/bg2.jpg"),
  },
  {
    id: "bg3.jpg",
    label: "bg3",
    color: "#fff7ed",
    source: require("../../assets/avatar-backgrounds/bg3.jpg"),
  },
  {
    id: "bg4.jpg",
    label: "bg4",
    color: "#f8fafc",
    source: require("../../assets/avatar-backgrounds/bg4.jpg"),
  },
  {
    id: "bg5.jpg",
    label: "bg5",
    color: "#f8fafc",
    source: require("../../assets/avatar-backgrounds/bg5.jpg"),
  },
] as const;

type ChatMessage = {
  id: string;
  message: string;
  me: boolean;
};

type SpeechQueueItem = {
  id: string;
  text: string;
};

type AuthProperty = "favoriteColor" | "homeCountry" | "homeState" | "mothersMaidenName";

type CandidateUser = {
  _id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  homeCity?: string;
  favoriteColor?: string;
  homeCountry?: string;
  homeState?: string;
  mothersMaidenName?: string;
  user?: {
    avatarName?: string;
    packages?: string[];
  };
};

type IntentResponse = {
  type?: string;
  message?: string;
  data?: CandidateUser[];
  newMessage?: string;
};

type PersonResponse = {
  status?: string;
  type?: string;
  data?: CandidateUser;
};

const AUTH_PROPERTIES: AuthProperty[] = [
  "favoriteColor",
  "homeCountry",
  "homeState",
  "mothersMaidenName",
];

const REGISTRATION_PROMPT = "You're not registered with BOTCierge. Please register at BOTCIERGE.com.";
const AUTH_FAILURE_PROMPT =
  "Based on your responses, I couldn't verify your identity. Please register at BOTCIERGE.com.";

const normalizeAvatarMessage = (message: string) => {
  const trimmedMessage = message.trim();
  const normalizedMessage = trimmedMessage.replace(/\s+/g, " ");

  if (/you'?re not registered with botcierge/i.test(normalizedMessage)) {
    return REGISTRATION_PROMPT;
  }

  if (/made a request that's a bit beyond/i.test(normalizedMessage) || /are you want to login/i.test(normalizedMessage)) {
    return "It looks like you're trying to do something beyond registration. If you'd like to sign in, just type 'login'.";
  }

  return trimmedMessage;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const avatarWebViewRef = useRef<{
    setAvatar: (avatar: string) => void;
    setBackground: (background: string) => void;
    setMood: (mood: string) => void;
    speakAudio: (payload: Record<string, unknown>) => void;
  } | null>(null);
  const lastDispatchedSpeechIdRef = useRef<string | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>(DEFAULT_AVATAR_OPTIONS);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(DEFAULT_AVATAR_ID);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(
    DEFAULT_AVATAR_OPTIONS[0]?.defaultVoiceId || DEFAULT_AVATAR_OPTIONS[0]?.voice?.id || null
  );
  const [selectedEmotionId, setSelectedEmotionId] = useState<(typeof EMOTION_OPTIONS)[number]["id"]>("happy");
  const [selectedBackgroundId, setSelectedBackgroundId] =
    useState<(typeof BACKGROUND_OPTIONS)[number]["id"]>("bg1.jpg");
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [chatStep, setChatStep] = useState<"name" | "intent" | "auth">("name");
  const [guestName, setGuestName] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [person, setPerson] = useState<CandidateUser | null>(null);
  const [users, setUsers] = useState<CandidateUser[]>([]);
  const [authProperties, setAuthProperties] = useState<AuthProperty[]>(AUTH_PROPERTIES);
  const [currentAuthProp, setCurrentAuthProp] = useState<AuthProperty | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "hello",
      message: buildHelloMessage("Prithi"),
      me: false,
    },
  ]);
  const [speechQueue, setSpeechQueue] = useState<SpeechQueueItem[]>([
    {
      id: "hello",
      text: buildHelloMessage("Prithi"),
    },
  ]);
  const selectedAvatar =
    avatarOptions.find((avatarOption) => avatarOption.id === selectedAvatarId) || avatarOptions[0] || DEFAULT_AVATAR_OPTIONS[0];
  const selectedVoiceOptions =
    (selectedAvatar?.voices && selectedAvatar.voices.length > 0 ? selectedAvatar.voices : selectedAvatar?.voice ? [selectedAvatar.voice] : []) ||
    [];
  const selectedVoice =
    selectedVoiceOptions.find((voiceOption) => voiceOption.id === selectedVoiceId) ||
    selectedAvatar?.voice ||
    selectedVoiceOptions[0] ||
    null;
  const selectedBackground =
    BACKGROUND_OPTIONS.find((backgroundOption) => backgroundOption.id === selectedBackgroundId) ||
    BACKGROUND_OPTIONS[0];
  const selectedBackgroundSource = selectedBackground.source as ImageSourcePropType | undefined;
  const activeSpeech = speechQueue[0] ?? null;

  const addAvatarMessage = (message: string) => {
    const messageId = `${Date.now()}-avatar`;
    const normalizedMessage = normalizeAvatarMessage(message);

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: messageId,
        message: normalizedMessage,
        me: false,
      },
    ]);
    setSpeechQueue((currentQueue) => [
      ...currentQueue,
      {
        id: messageId,
        text: normalizedMessage,
      },
    ]);
  };

  const advanceSpeechQueue = useCallback(() => {
    setSpeechQueue((currentQueue) => currentQueue.slice(1));
  }, []);

  const hydrateAvatarOptions = useCallback((supportedAvatars?: AvatarRuntimeDescriptor[]) => {
    if (!Array.isArray(supportedAvatars) || supportedAvatars.length === 0) {
      return;
    }

    const nextAvatarOptions = supportedAvatars
      .map((avatarDescriptor) => {
        const nextAvatarId = String(avatarDescriptor?.id || "").trim().toLowerCase();
        const nextLabel = String(avatarDescriptor?.label || nextAvatarId).trim();

        if (!nextAvatarId || !nextLabel) {
          return null;
        }

        return {
          id: nextAvatarId,
          label: nextLabel,
          available: true as boolean,
          voice: avatarDescriptor?.voice || null,
          voices: Array.isArray(avatarDescriptor?.voices)
            ? avatarDescriptor.voices.filter((voiceOption) => voiceOption?.id && voiceOption?.label)
            : avatarDescriptor?.voice
              ? [avatarDescriptor.voice]
              : [],
          defaultVoiceId: avatarDescriptor?.defaultVoiceId || avatarDescriptor?.voice?.id || null,
        } as AvatarOption;
      })
      .filter((avatarOption): avatarOption is AvatarOption => avatarOption !== null);

    if (!nextAvatarOptions.length) {
      return;
    }

    setAvatarOptions(nextAvatarOptions);
    setSelectedAvatarId((currentAvatarId) =>
      nextAvatarOptions.some((avatarOption) => avatarOption.id === currentAvatarId)
        ? currentAvatarId
        : nextAvatarOptions[0].id
    );
  }, []);

  const handleAvatarEvent = useCallback(
    (event?: AvatarEvent) => {
      if (event?.type === "avatar_ready") {
        hydrateAvatarOptions(event.supportedAvatars);
      }

      if (event?.type === "speech_finished" || event?.type === "avatar_error") {
        advanceSpeechQueue();
      }
    },
    [advanceSpeechQueue, hydrateAvatarOptions]
  );

  const authenticationMessage = (property: AuthProperty) => {
    if (property === "favoriteColor") {
      return "What's your favorite color?";
    }

    if (property === "homeCountry") {
      return "What's your home country?";
    }

    if (property === "homeState") {
      return "What's your home state?";
    }

    return "What's your mother's maiden name?";
  };

  const getLimit = (property: AuthProperty) => (property === "mothersMaidenName" ? 50 : 30);

  const resetAuthChallenge = () => {
    setAuthProperties(AUTH_PROPERTIES);
    setCurrentAuthProp(null);
    setUsers([]);
    setChatStep("intent");
  };

  const verifyPerson = async (user: CandidateUser) => {
    const response = await fetch(`${baseURL}users/getPersonById`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: { _id: user._id } }),
    });

    const responseJson = (await response.json().catch(() => ({}))) as PersonResponse;

    if (!response.ok || responseJson.type !== "person" || responseJson.status !== "OK" || !responseJson.data) {
      throw new Error(AUTH_FAILURE_PROMPT);
    }

    const verifiedPerson = {
      ...responseJson.data,
      _id: user._id,
    };

    setAuthenticated(true);
    setPerson(verifiedPerson);
    resetAuthChallenge();
    addAvatarMessage("I have successfully verified your identity. How may I assist you?");

    if (verifiedPerson.user?.avatarName && verifiedPerson.user.avatarName !== "Prithi") {
      addAvatarMessage(`I see you've chosen ${verifiedPerson.user.avatarName} to be your host`);
      addAvatarMessage(`Bye ${guestName}. ${verifiedPerson.user.avatarName} will take care of you from here :)`);
    }
  };

  const askNextAuthQuestion = async (candidateUsers: CandidateUser[], remainingProperties: AuthProperty[]) => {
    if (candidateUsers.length === 0) {
      addAvatarMessage(AUTH_FAILURE_PROMPT);
      resetAuthChallenge();
      return;
    }

    if (remainingProperties.length === 0 || candidateUsers.length === 1) {
      await verifyPerson(candidateUsers[0]);
      return;
    }

    const [nextProperty, ...nextRemainingProperties] = remainingProperties;
    setCurrentAuthProp(nextProperty);
    setAuthProperties(nextRemainingProperties);
    addAvatarMessage(authenticationMessage(nextProperty));
  };

  const handleAuthMessage = async (nextMessage: string) => {
    if (authProperties.length === AUTH_PROPERTIES.length && !currentAuthProp) {
      if (nextMessage.length > 20) {
        addAvatarMessage("I don't understand. Please be more concise.");
        return;
      }

      if (nextMessage.toLowerCase().includes("yes")) {
        await askNextAuthQuestion(users, authProperties);
        return;
      }

      if (nextMessage.toLowerCase().includes("no")) {
        const firstUser = users[0];
        const filteredUsers = users.filter(
          (user) => user.lastName !== firstUser?.lastName || user.homeCity !== firstUser?.homeCity
        );

        if (filteredUsers.length > 0) {
          setUsers(filteredUsers);
          addAvatarMessage(`Are you ${guestName} ${filteredUsers[0].lastName} from ${filteredUsers[0].homeCity}?`);
        } else {
          addAvatarMessage(AUTH_FAILURE_PROMPT);
          resetAuthChallenge();
        }
        return;
      }

      addAvatarMessage("I don't understand. Please be more concise.");
      return;
    }

    if (!currentAuthProp) {
      await askNextAuthQuestion(users, authProperties);
      return;
    }

    if (nextMessage.length > getLimit(currentAuthProp)) {
      addAvatarMessage("I don't understand. Please be more concise.");
      return;
    }

    const filteredUsers = users.filter((user) => {
      const expectedValue = user[currentAuthProp];
      return expectedValue ? nextMessage.toLowerCase().includes(expectedValue.toLowerCase()) : false;
    });

    setUsers(filteredUsers);
    await askNextAuthQuestion(filteredUsers, authProperties);
  };

  const sendRequestMessage = async (nextMessage: string) => {
    const response = await fetch(`${baseURL}requests/requestHandler`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        srx: {
          _id: person?._id,
          email: person?.email,
          intent: nextMessage.toLowerCase(),
          packages: person?.user?.packages || [],
          isAiMessage: false,
        },
      }),
    });

    const responseJson = (await response.json().catch(() => ({}))) as IntentResponse;

    if (!response.ok) {
      throw new Error(responseJson?.message || `BOTCierge request failed with ${response.status}`);
    }

    if (responseJson.newMessage) {
      addAvatarMessage(responseJson.newMessage);
    }

    addAvatarMessage(responseJson.message || "I received that, but I do not have a response yet.");
  };

  const sendIntentMessage = async (nextMessage: string) => {
    const response = await fetch(`${baseURL}intents/intentHandler`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        srx: {
          firstName: guestName || "Guest",
          speechInput: nextMessage.toLowerCase(),
        },
      }),
    });

    const responseJson = (await response.json().catch(() => ({}))) as IntentResponse;

    if (!response.ok) {
      throw new Error(responseJson?.message || `BOTCierge request failed with ${response.status}`);
    }

    if (responseJson.type === "authentication") {
      if (authenticated) {
        addAvatarMessage("You're already logged in.");
        return;
      }

      if (!responseJson.data?.length) {
        addAvatarMessage(REGISTRATION_PROMPT);
        return;
      }

      setUsers(responseJson.data);
      setAuthProperties(AUTH_PROPERTIES);
      setCurrentAuthProp(null);
      setChatStep("auth");
      addAvatarMessage(`Are you ${guestName} ${responseJson.data[0].lastName} from ${responseJson.data[0].homeCity}?`);
      return;
    }

    addAvatarMessage(responseJson.message || "I received that, but I do not have a response yet.");
  };

  const sendMessage = async () => {
    const nextMessage = input.trim();

    if (!nextMessage || isReplying) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${Date.now()}`,
        message: nextMessage,
        me: true,
      },
    ]);
    setInput("");

    if (chatStep === "name") {
      if (!/^[A-Za-z0-9' ]+\??$/.test(nextMessage)) {
        addAvatarMessage("Invalid name");
        return;
      }

      if (nextMessage.includes(" ")) {
        const lastWord = nextMessage.split(" ").pop() || nextMessage;
        addAvatarMessage(`${lastWord}, your name cannot contain spaces.`);
        return;
      }

      setGuestName(nextMessage);
      setChatStep("intent");
      addAvatarMessage(`Hi ${nextMessage}, welcome to the BOTCierge experience. How may I assist you?`);
      return;
    }

    if (chatStep === "auth") {
      setIsReplying(true);

      try {
        await handleAuthMessage(nextMessage);
      } catch (error) {
        addAvatarMessage(
          error instanceof Error
            ? error.message
            : AUTH_FAILURE_PROMPT
        );
        resetAuthChallenge();
      } finally {
        setIsReplying(false);
      }

      return;
    }

    setIsReplying(true);

    try {
      if (authenticated) {
        await sendRequestMessage(nextMessage);
      } else {
        await sendIntentMessage(nextMessage);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "I could not reach BOTCierge right now. Please try again.";

      addAvatarMessage(message);
    } finally {
      setIsReplying(false);
    }
  };

  useEffect(() => {
    avatarWebViewRef.current?.setAvatar(selectedAvatar.label);
  }, [selectedAvatar.label]);

  useEffect(() => {
    const availableVoices =
      selectedAvatar?.voices && selectedAvatar.voices.length > 0
        ? selectedAvatar.voices
        : selectedAvatar?.voice
          ? [selectedAvatar.voice]
          : [];

    if (!availableVoices.length) {
      setSelectedVoiceId(null);
      return;
    }

    setSelectedVoiceId((currentVoiceId) => {
      if (currentVoiceId && availableVoices.some((voiceOption) => voiceOption.id === currentVoiceId)) {
        return currentVoiceId;
      }

      return selectedAvatar?.defaultVoiceId || selectedAvatar?.voice?.id || availableVoices[0].id;
    });
  }, [selectedAvatar?.defaultVoiceId, selectedAvatar?.id, selectedAvatar?.voice, selectedAvatar?.voices]);

  useEffect(() => {
    avatarWebViewRef.current?.setMood(selectedEmotionId);
  }, [selectedEmotionId]);

  useEffect(() => {
    avatarWebViewRef.current?.setBackground(selectedBackgroundId);
  }, [selectedBackgroundId]);

  useEffect(() => {
    if (!activeSpeech?.text) {
      return;
    }

    if (lastDispatchedSpeechIdRef.current === activeSpeech.id) {
      return;
    }

    lastDispatchedSpeechIdRef.current = activeSpeech.id;

    let isCancelled = false;

    const run = async () => {
      try {
        const cached = await getCachedSpeech(activeSpeech.text, selectedAvatar.id, selectedVoice?.id);

        let payload = cached;

        if (!payload) {
          const response = await fetch(SPEECH_SYNTHESIS_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: activeSpeech.text,
              avatar: selectedAvatar.id,
              mood: selectedEmotionId,
              voiceId: selectedVoice?.id,
              voiceLabel: selectedVoice?.label,
            }),
          });

          const responsePayload = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(responsePayload?.error || responsePayload?.message || `Avatar speech service failed with ${response.status}`);
          }

          payload = responsePayload;
          cacheSpeech(activeSpeech.text, selectedAvatar.id, selectedVoice?.id, responsePayload);
        }

        if (isCancelled) {
          return;
        }

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
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.log("[HomeScreen][AvatarWebView][speech-error]", error);
        lastDispatchedSpeechIdRef.current = null;
        advanceSpeechQueue();
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [
    activeSpeech?.id,
    activeSpeech?.text,
    advanceSpeechQueue,
    selectedAvatar.id,
    selectedAvatar.label,
    selectedEmotionId,
    selectedVoice?.id,
    selectedVoice?.label,
  ]);

  // TASK-11: While item[0] is speaking, prefetch TTS for item[1] so it plays instantly on queue advance.
  const nextSpeech = speechQueue[1] ?? null;
  useEffect(() => {
    if (!nextSpeech?.text) return;

    let isCancelled = false;

    const prefetch = async () => {
      const cached = await getCachedSpeech(nextSpeech.text, selectedAvatar.id, selectedVoice?.id);
      if (cached || isCancelled) return;

      try {
        const response = await fetch(SPEECH_SYNTHESIS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: nextSpeech.text,
            avatar: selectedAvatar.id,
            mood: selectedEmotionId,
            voiceId: selectedVoice?.id,
            voiceLabel: selectedVoice?.label,
          }),
        });
        if (!response.ok || isCancelled) return;
        const payload = await response.json().catch(() => null);
        if (payload && !isCancelled) {
          cacheSpeech(nextSpeech.text, selectedAvatar.id, selectedVoice?.id, payload);
        }
      } catch {
        // prefetch best-effort, ignore errors
      }
    };

    void prefetch();
    return () => { isCancelled = true; };
  }, [
    nextSpeech?.id,
    nextSpeech?.text,
    selectedAvatar.id,
    selectedEmotionId,
    selectedVoice?.id,
    selectedVoice?.label,
  ]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
      style={styles.screen}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 8),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.app}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable
                accessibilityLabel="Open avatar settings"
                accessibilityRole="button"
                onPress={() => setIsSelectorOpen(true)}
                style={({ pressed }) => [styles.hamburger, pressed && styles.pressedControl]}
              >
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </Pressable>
              <View style={styles.brand}>
                <Text allowFontScaling={false} style={styles.brandName}>
                  BOTCIERGE
                </Text>
                <Text allowFontScaling={false} style={styles.brandStatus}>
                  • Online
                </Text>
              </View>
            </View>
            <Text allowFontScaling={false} style={styles.headerIcon}>
              ⌄
            </Text>
          </View>

          <View style={[styles.avatarPanel, { backgroundColor: selectedBackground.color }]}>
            {selectedBackgroundSource ? (
              <ImageBackground
                imageStyle={styles.avatarBackgroundImage}
                resizeMode="cover"
                source={selectedBackgroundSource}
                style={styles.avatarBackground}
              >
                <AvatarWebView
                  ref={avatarWebViewRef}
                  avatar={selectedAvatar.label}
                  background={selectedBackgroundId}
                  onAvatarEvent={handleAvatarEvent}
                  style={styles.avatarDemo}
                />
              </ImageBackground>
            ) : (
              <AvatarWebView
                ref={avatarWebViewRef}
                avatar={selectedAvatar.label}
                background={selectedBackgroundId}
                onAvatarEvent={handleAvatarEvent}
                style={styles.avatarDemo}
              />
            )}
          </View>

          <ScrollView
            ref={scrollViewRef}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            style={styles.chatScroller}
            contentContainerStyle={styles.chatContent}
          >
            {messages.map((message) => {
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.me ? styles.myMessageRow : styles.avatarMessageRow,
                  ]}
                >
                  {!message.me ? (
                    <View style={styles.avatarBadge}>
                      <Text allowFontScaling={false} style={styles.avatarBadgeText}>
                        {selectedAvatar.label.charAt(0)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={[styles.bubble, message.me ? styles.myBubble : styles.avatarBubble]}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.bubbleText, message.me ? styles.myBubbleText : styles.avatarBubbleText]}
                    >
                      {message.message}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {isReplying ? (
            <View style={[styles.messageRow, styles.avatarMessageRow, styles.typingRow]}>
              <View style={styles.avatarBadge}>
                <Text allowFontScaling={false} style={styles.avatarBadgeText}>
                  {selectedAvatar.label.charAt(0)}
                </Text>
              </View>
              <View style={[styles.bubble, styles.avatarBubble, styles.typingBubble]}>
                <Text allowFontScaling={false} style={[styles.bubbleText, styles.avatarBubbleText]}>
                  {selectedAvatar.label} is typing...
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.inputBar}>
            <TextInput
              allowFontScaling={false}
              editable={!isReplying}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              placeholder={
                isReplying
                  ? `${selectedAvatar.label} is thinking...`
                  : chatStep === "name"
                    ? "Name"
                    : "Intent"
              }
              placeholderTextColor="#9ca3af"
              returnKeyType="send"
              style={styles.input}
              value={input}
            />
            <Pressable
              accessibilityRole="button"
              disabled={isReplying}
              onPress={sendMessage}
              style={({ pressed }) => [
                styles.sendButton,
                (pressed || isReplying) && styles.sendButtonPressed,
              ]}
            >
              <Text allowFontScaling={false} style={styles.sendButtonText}>
                ➤
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
      <Modal
        animationType="fade"
        onRequestClose={() => setIsSelectorOpen(false)}
        transparent
        visible={isSelectorOpen}
      >
        <Pressable style={styles.sheetScrim} onPress={() => setIsSelectorOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text allowFontScaling={false} style={styles.sheetTitle}>
                  Avatar
                </Text>
                <Text allowFontScaling={false} style={styles.sheetSubtitle}>
                  Choose the host and scene background.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close avatar settings"
                accessibilityRole="button"
                onPress={() => setIsSelectorOpen(false)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressedControl]}
              >
                <Text allowFontScaling={false} style={styles.closeButtonText}>
                  ×
                </Text>
              </Pressable>
            </View>

            <Text allowFontScaling={false} style={styles.selectorLabel}>
              Host
            </Text>
            <Dropdown
              data={avatarOptions.map((avatarOption) => ({
                label: avatarOption.label,
                value: avatarOption.id,
              }))}
              labelField="label"
              maxHeight={220}
              onChange={(item) => {
                const nextAvatar = avatarOptions.find((avatarOption) => avatarOption.id === item.value);

                if (nextAvatar) {
                  setSelectedAvatarId(nextAvatar.id);
                }
              }}
              placeholder="Select avatar"
              selectedTextStyle={styles.dropdownSelectedText}
              style={styles.dropdown}
              value={selectedAvatarId}
              valueField="value"
            />

            <Text allowFontScaling={false} style={styles.selectorLabel}>
              Emotion
            </Text>
            <Dropdown
              data={EMOTION_OPTIONS.map((emotionOption) => ({
                label: emotionOption.label,
                value: emotionOption.id,
              }))}
              labelField="label"
              maxHeight={240}
              onChange={(item) => setSelectedEmotionId(item.value)}
              placeholder="Select emotion"
              selectedTextStyle={styles.dropdownSelectedText}
              style={styles.dropdown}
              value={selectedEmotionId}
              valueField="value"
            />

            <Text allowFontScaling={false} style={styles.selectorLabel}>
              Voice
            </Text>
            <Dropdown
              data={selectedVoiceOptions.map((voiceOption) => ({
                label: voiceOption.label,
                value: voiceOption.id,
              }))}
              disable={selectedVoiceOptions.length <= 1}
              labelField="label"
              maxHeight={220}
              onChange={(item) => setSelectedVoiceId(item.value)}
              placeholder="Select voice"
              selectedTextStyle={styles.dropdownSelectedText}
              style={[
                styles.dropdown,
                selectedVoiceOptions.length <= 1 && styles.dropdownDisabled,
              ]}
              value={selectedVoice?.id || null}
              valueField="value"
            />

            <Text allowFontScaling={false} style={styles.selectorLabel}>
              Background
            </Text>
            <Dropdown
              data={BACKGROUND_OPTIONS.map((backgroundOption) => ({
                label: backgroundOption.label,
                value: backgroundOption.id,
              }))}
              labelField="label"
              maxHeight={260}
              onChange={(item) => setSelectedBackgroundId(item.value)}
              placeholder="Select background"
              renderLeftIcon={() =>
                selectedBackgroundSource ? (
                  <Image source={selectedBackgroundSource} style={styles.dropdownThumbnail} />
                ) : (
                  <View style={styles.dropdownEmptyThumbnail} />
                )
              }
              selectedTextStyle={styles.dropdownSelectedText}
              style={styles.dropdown}
              value={selectedBackgroundId}
              valueField="value"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#ffffff",
    flex: 1,
  },
  content: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flex: 1,
  },
  app: {
    backgroundColor: "#ffffff",
    flex: 1,
    maxWidth: 480,
    width: "100%",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#eeeeee",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  hamburger: {
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 6,
    width: 24,
  },
  hamburgerLine: {
    backgroundColor: "#333333",
    borderRadius: 1,
    height: 2,
    width: "100%",
  },
  brand: {
    alignItems: "center",
  },
  brandName: {
    color: "#6B4EAA",
    fontSize: 18,
    fontWeight: "600",
  },
  brandStatus: {
    color: "#22c55e",
    fontSize: 12,
  },
  headerIcon: {
    color: "#333333",
    fontSize: 24,
    opacity: 0.7,
  },
  avatarPanel: {
    backgroundColor: "#ffffff",
    height: 260,
    overflow: "hidden",
    position: "relative",
  },
  avatarBackground: {
    flex: 1,
  },
  avatarBackgroundImage: {
    opacity: 1,
  },
  avatarDemo: {
    flex: 1,
  },
  chatScroller: {
    flex: 1,
  },
  chatContent: {
    flexGrow: 1,
    gap: 10,
    justifyContent: "flex-start",
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 10,
  },
  messageRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    width: "100%",
  },
  avatarMessageRow: {
    justifyContent: "flex-start",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  typingRow: {
    paddingHorizontal: 12,
  },
  avatarBadge: {
    alignItems: "center",
    backgroundColor: "#f0ecfb",
    borderColor: "#ded4f4",
    borderRadius: 15,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    marginRight: 8,
    width: 30,
  },
  avatarBadgeText: {
    color: "#6B4EAA",
    fontSize: 13,
    fontWeight: "700",
  },
  bubble: {
    borderRadius: 12,
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatarBubble: {
    backgroundColor: "#ECECEC",
    borderBottomLeftRadius: 4,
  },
  typingBubble: {
    opacity: 0.9,
  },
  myBubble: {
    backgroundColor: "#4F8DBF",
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  avatarBubbleText: {
    color: "#111827",
  },
  myBubbleText: {
    color: "#ffffff",
  },
  inputBar: {
    alignItems: "center",
    borderColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
    marginHorizontal: 16,
    marginTop: 8,
    minHeight: 48,
    paddingHorizontal: 8,
  },
  input: {
    color: "#111827",
    flex: 1,
    fontSize: 15,
    minHeight: 42,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#6B4EAA",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  sendButtonPressed: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    transform: [{ rotate: "-45deg" }],
  },
  pressedControl: {
    opacity: 0.65,
  },
  sheetScrim: {
    backgroundColor: "rgba(17, 24, 39, 0.35)",
    flex: 1,
    justifyContent: "flex-start",
  },
  sheet: {
    backgroundColor: "#ffffff",
    height: "100%",
    gap: 14,
    maxWidth: 320,
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 24,
    width: "82%",
  },
  sheetHandle: {
    display: "none",
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
  },
  sheetSubtitle: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    alignItems: "center",
    borderColor: "#e5e7eb",
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  closeButtonText: {
    color: "#374151",
    fontSize: 24,
    lineHeight: 26,
  },
  selectorLabel: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  dropdown: {
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  dropdownDisabled: {
    opacity: 0.6,
  },
  dropdownSelectedText: {
    color: "#111827",
    fontSize: 14,
  },
  dropdownThumbnail: {
    borderColor: "#d1d5db",
    borderRadius: 6,
    borderWidth: 1,
    height: 28,
    marginRight: 8,
    width: 36,
  },
  dropdownEmptyThumbnail: {
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
    borderRadius: 6,
    borderWidth: 1,
    height: 28,
    marginRight: 8,
    width: 36,
  },
});
