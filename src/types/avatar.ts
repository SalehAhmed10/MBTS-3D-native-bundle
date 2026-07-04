export type AvatarVoiceOption = {
  id: string;
  label: string;
};

export type AvatarOption = {
  id: string;
  label: string;
  available: boolean;
  voice?: AvatarVoiceOption | null;
  voices?: AvatarVoiceOption[];
  defaultVoiceId?: string | null;
};

export type AvatarRuntimeDescriptor = {
  id?: string;
  label?: string;
  voice?: AvatarVoiceOption | null;
  voices?: AvatarVoiceOption[] | null;
  defaultVoiceId?: string | null;
};

export type AvatarEvent = {
  type?: string;
  supportedAvatars?: AvatarRuntimeDescriptor[];
};
