import { useCallback, useRef } from "react";
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from "react-native";
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from "react-native-reanimated";
import { Dropdown } from "react-native-element-dropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatusBar } from "expo-status-bar";
import AvatarWebView from "@/components/avatar/AvatarWebView";
import { useAvatarStore } from "@/stores/avatarStore";
import { useChatStore } from "@/stores/chatStore";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { useSpeech } from "@/hooks/useSpeech";

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
    id: "camilia",
    label: "Camille",
    available: true,
    voice: {
      id: "camilia-default",
      label: "Camille Default",
    },
    voices: [
      {
        id: "camilia-default",
        label: "Camille Default",
      },
    ],
    defaultVoiceId: "camilia-default",
  },
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
];

const DEFAULT_AVATAR_ID = "camilia";

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

const BACKGROUND_OPTIONS: Array<{
  id: string;
  label: string;
  color: string;
  source: ImageSourcePropType | undefined;
  category: "none" | "scenes" | "cities";
}> = [
  { id: "none",            label: "None",      color: "#ffffff", source: undefined,                                                                                         category: "none" },
  { id: "bg1.jpg",         label: "Scene 1",   color: "#f4f0ff", source: require("../../assets/avatar-backgrounds/bg1.jpg") as ImageSourcePropType,                        category: "scenes" },
  { id: "bg2.jpg",         label: "Scene 2",   color: "#eef7ff", source: require("../../assets/avatar-backgrounds/bg2.jpg") as ImageSourcePropType,                        category: "scenes" },
  { id: "bg3.jpg",         label: "Scene 3",   color: "#fff7ed", source: require("../../assets/avatar-backgrounds/bg3.jpg") as ImageSourcePropType,                        category: "scenes" },
  { id: "bg4.jpg",         label: "Scene 4",   color: "#f8fafc", source: require("../../assets/avatar-backgrounds/bg4.jpg") as ImageSourcePropType,                        category: "scenes" },
  { id: "bg5.jpg",         label: "Scene 5",   color: "#f8fafc", source: require("../../assets/avatar-backgrounds/bg5.jpg") as ImageSourcePropType,                        category: "scenes" },
  { id: "bg_spaceship.jpg",label: "Spaceship", color: "#0d0d1a", source: require("../../assets/avatar-backgrounds/bg_spaceship.jpg") as ImageSourcePropType,                category: "scenes" },
  { id: "bg_nyc2.jpg",     label: "New York",  color: "#e8f0f8", source: require("../../assets/avatar-backgrounds/bg_nyc2.jpg") as ImageSourcePropType,                    category: "cities" },
  { id: "bg_dubai.jpg",    label: "Dubai",     color: "#fdf5e6", source: require("../../assets/avatar-backgrounds/bg_dubai.jpg") as ImageSourcePropType,                   category: "cities" },
  { id: "bg_hongkong.jpg", label: "Hong Kong", color: "#f0f4f8", source: require("../../assets/avatar-backgrounds/bg_hongkong.jpg") as ImageSourcePropType,                category: "cities" },
  { id: "bg_beijing.jpg",  label: "Beijing",   color: "#fef3e8", source: require("../../assets/avatar-backgrounds/bg_beijing.jpg") as ImageSourcePropType,                 category: "cities" },
  { id: "bg_munich.jpg",   label: "Munich",    color: "#f0f6ee", source: require("../../assets/avatar-backgrounds/bg_munich.jpg") as ImageSourcePropType,                  category: "cities" },
  { id: "bg_glasgow.jpg",  label: "Glasgow",   color: "#edf2f8", source: require("../../assets/avatar-backgrounds/bg_glasgow.jpg") as ImageSourcePropType,                 category: "cities" },
  { id: "bg_honolulu.jpg", label: "Honolulu",  color: "#e8f6f8", source: require("../../assets/avatar-backgrounds/bg_honolulu.jpg") as ImageSourcePropType,                category: "cities" },
];

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

type ChatApiResponse = {
  reply?: string;
  emotion?: string;
  type?: string;
  modalType?: string | null;
  data?: CandidateUser[] | null;
  srxState?: unknown;
};

type ConversationTurn = {
  role: 'user' | 'assistant';
  content: string;
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
  const keyboard = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true, isNavigationBarTranslucentAndroid: true });
  const keyboardSpacerStyle = useAnimatedStyle(() => ({ height: keyboard.height.value }));
  const scrollViewRef = useRef<ScrollView>(null);
  const avatarWebViewRef = useRef<{
    setAvatar: (avatar: string) => void;
    setBackground: (background: string) => void;
    setMood: (mood: string) => void;
    speakAudio: (payload: Record<string, unknown>) => void;
  } | null>(null);
  const {
    avatarOptions,
    selectedAvatarId,
    selectedVoiceId,
    selectedEmotionId,
    selectedBackgroundId,
    activeBgCategory,
    isSelectorOpen,
    setAvatarOptions,
    setSelectedAvatarId,
    setSelectedVoiceId,
    setSelectedEmotionId,
    setSelectedBackgroundId,
    setActiveBgCategory,
    setIsSelectorOpen,
  } = useAvatarStore();

  const {
    messages,
    speechQueue,
    input,
    isReplying,
    srxState,
    addMessage,
    addSpeechItem,
    advanceSpeechQueue,
    setInput,
    setIsReplying,
    setSrxState,
    setUsers,
    setAuthProperties: setChatStoreAuthProperties,
    setCurrentAuthProp: setChatStoreCurrentAuthProp,
    setChatStep,
  } = useChatStore();

  const { mutateAsync: sendChatMutate } = useSendMessage();
  const selectedAvatar =
    avatarOptions.find((avatarOption) => avatarOption.id === selectedAvatarId) || avatarOptions[0] || DEFAULT_AVATAR_OPTIONS[0];
  const greeting = buildHelloMessage(selectedAvatar.label);
  const displayMessages: ChatMessage[] = [{ id: 'hello', message: greeting, me: false }, ...messages];
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

  const addAvatarMessage = useCallback((message: string) => {
    const id = `${Date.now()}-avatar`;
    const normalized = normalizeAvatarMessage(message);
    addMessage({ id, message: normalized, me: false });
    addSpeechItem({ id, text: normalized });
  }, [addMessage, addSpeechItem]);

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
    setSelectedAvatarId(
      nextAvatarOptions.some((o) => o.id === selectedAvatarId)
        ? selectedAvatarId
        : nextAvatarOptions[0].id
    );
  }, [selectedAvatarId, setAvatarOptions, setSelectedAvatarId]);

  const handleAvatarEvent = useCallback(
    (event?: AvatarEvent) => {
      if (event?.type === "avatar_ready") {
        hydrateAvatarOptions(event.supportedAvatars);
        // Speak greeting once WebView is ready. Queue was empty at mount — this is the trigger.
        const helloText = buildHelloMessage(
          (event.supportedAvatars?.find((a) => a.id === selectedAvatarId)?.label) ??
          DEFAULT_AVATAR_OPTIONS[0].label
        );
        addSpeechItem({ id: 'hello', text: helloText });
      }

      if (event?.type === "speech_finished" || event?.type === "avatar_error") {
        advanceSpeechQueue();
      }
    },
    [advanceSpeechQueue, hydrateAvatarOptions, addSpeechItem, selectedAvatarId]
  );

  const { chatStep, guestName, person, authenticated, handleAuthMessage, handleNameMessage, resetAuthChallenge } =
    useAuthFlow(addAvatarMessage);

  useSpeech({ avatarWebViewRef, selectedAvatar, selectedEmotionId, selectedVoice });

  const handleSelectEmotion = (id: string) => {
    setSelectedEmotionId(id);
    avatarWebViewRef.current?.setMood(id);
  };

  const handleSelectBackground = (id: string) => {
    setSelectedBackgroundId(id);
    avatarWebViewRef.current?.setBackground(id);
  };

  const sendMessage = async () => {
    const nextMessage = input.trim();
    if (!nextMessage || isReplying) return;

    addMessage({ id: `${Date.now()}`, message: nextMessage, me: true });
    setInput('');

    if (chatStep === 'name') {
      handleNameMessage(nextMessage);
      return;
    }

    if (chatStep === 'auth') {
      setIsReplying(true);
      try {
        await handleAuthMessage(nextMessage);
      } catch (err) {
        addAvatarMessage(err instanceof Error ? err.message : AUTH_FAILURE_PROMPT);
        resetAuthChallenge();
      } finally {
        setIsReplying(false);
      }
      return;
    }

    setIsReplying(true);
    try {
      const result = await sendChatMutate(nextMessage);
      if (result.srxState !== undefined) setSrxState(result.srxState);
      if (result.emotion) avatarWebViewRef.current?.setMood(result.emotion);

      const reply = normalizeAvatarMessage(result.reply || 'I received that, but I do not have a response yet.');

      if (result.type === 'authentication') {
        if (authenticated) {
          addAvatarMessage("You're already logged in.");
          return;
        }
        if (!(result.data as CandidateUser[] | null)?.length) {
          addAvatarMessage(REGISTRATION_PROMPT);
          return;
        }
        const authData = result.data as CandidateUser[];
        setUsers(authData);
        setChatStoreAuthProperties(AUTH_PROPERTIES);
        setChatStoreCurrentAuthProp(null);
        setChatStep('auth');
        addAvatarMessage(`Are you ${guestName} ${authData[0].lastName} from ${authData[0].homeCity}?`);
        return;
      }

      addAvatarMessage(reply);
    } catch (err) {
      addAvatarMessage(
        err instanceof Error ? err.message : 'I could not reach BOTCierge right now. Please try again.'
      );
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
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
            {displayMessages.map((message) => {
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
          <Animated.View style={keyboardSpacerStyle} />
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
              onChange={(item) => handleSelectEmotion(item.value)}
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
            <View style={styles.bgCategoryRow}>
              <Pressable
                onPress={() => setActiveBgCategory(activeBgCategory === "scenes" ? null : "scenes")}
                style={[styles.bgCategoryBtn, activeBgCategory === "scenes" && styles.bgCategoryBtnActive]}
              >
                <Text allowFontScaling={false} style={[styles.bgCategoryBtnText, activeBgCategory === "scenes" && styles.bgCategoryBtnTextActive]}>
                  🎬 Scenes
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveBgCategory(activeBgCategory === "cities" ? null : "cities")}
                style={[styles.bgCategoryBtn, activeBgCategory === "cities" && styles.bgCategoryBtnActive]}
              >
                <Text allowFontScaling={false} style={[styles.bgCategoryBtnText, activeBgCategory === "cities" && styles.bgCategoryBtnTextActive]}>
                  🌆 Cities
                </Text>
              </Pressable>
            </View>
            {activeBgCategory !== null && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.bgGallery}
                contentContainerStyle={styles.bgGalleryContent}
              >
                {activeBgCategory === "scenes" && (
                  <Pressable onPress={() => handleSelectBackground("none")} style={styles.bgThumbWrap}>
                    <View style={[styles.bgThumb, styles.bgNoneThumb, selectedBackgroundId === "none" && styles.bgThumbSelected]}>
                      <Text allowFontScaling={false} style={styles.bgNoneText}>✕</Text>
                    </View>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.bgThumbLabel}>None</Text>
                  </Pressable>
                )}
                {BACKGROUND_OPTIONS.filter((opt) => opt.category === activeBgCategory).map((bg) => (
                  <Pressable key={bg.id} onPress={() => handleSelectBackground(bg.id)} style={styles.bgThumbWrap}>
                    {bg.source ? (
                      <Image source={bg.source} style={[styles.bgThumb, selectedBackgroundId === bg.id && styles.bgThumbSelected]} />
                    ) : (
                      <View style={[styles.bgThumb, styles.bgNoneThumb, selectedBackgroundId === bg.id && styles.bgThumbSelected]} />
                    )}
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.bgThumbLabel}>{bg.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
  avatarPanel: {
    backgroundColor: "#ffffff",
    height: 260,
    flexShrink: 1,
    minHeight: 120,
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
  bgCategoryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  bgCategoryBtn: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 8,
  },
  bgCategoryBtnActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  bgCategoryBtnText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
  },
  bgCategoryBtnTextActive: {
    color: "#ffffff",
  },
  bgGallery: {
    marginBottom: 4,
  },
  bgGalleryContent: {
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  bgThumbWrap: {
    alignItems: "center",
    width: 64,
  },
  bgThumb: {
    borderColor: "transparent",
    borderRadius: 32,
    borderWidth: 2,
    height: 56,
    overflow: "hidden",
    width: 56,
  },
  bgThumbSelected: {
    borderColor: "#7c3aed",
    borderWidth: 3,
  },
  bgNoneThumb: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
  },
  bgNoneText: {
    color: "#9ca3af",
    fontSize: 20,
  },
  bgThumbLabel: {
    color: "#6b7280",
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
    width: 64,
  },
});
