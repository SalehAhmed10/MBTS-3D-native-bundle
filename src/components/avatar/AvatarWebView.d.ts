import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type AvatarWebViewEvent = {
  type?: string;
  supportedAvatars?: Array<{
    id?: string;
    label?: string;
    voice?: {
      id: string;
      label: string;
    } | null;
  }>;
  [key: string]: unknown;
};

export type AvatarWebViewHandle = {
  setAvatar: (avatar: string) => void;
  setBackground: (background: string) => void;
  setMood: (mood: string) => void;
  speakAudio: (payload: Record<string, unknown>) => void;
};

export type AvatarWebViewProps = {
  avatar?: string;
  background?: string;
  onAvatarEvent?: (event?: AvatarWebViewEvent) => void;
  sourceUrl?: string;
  style?: StyleProp<ViewStyle>;
};

declare const AvatarWebView: ForwardRefExoticComponent<
  AvatarWebViewProps & RefAttributes<AvatarWebViewHandle>
>;

export default AvatarWebView;
