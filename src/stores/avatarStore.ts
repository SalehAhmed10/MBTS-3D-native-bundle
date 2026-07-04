import { create } from 'zustand';
import { mmkvStorage } from '@/utils/mmkv';
import { DEFAULT_AVATAR_ID } from '@/config';
import type { AvatarOption } from '@/types/avatar';

const CDN_BACKGROUNDS = new Set([
  'none', 'bg_beijing.jpg', 'bg_dubai.jpg', 'bg_glasgow.jpg',
  'bg_hongkong.jpg', 'bg_honolulu.jpg', 'bg_munich.jpg',
  'bg_nyc2.jpg', 'bg_spaceship.jpg',
]);

function getPersistedBackground(): string {
  const persisted = mmkvStorage.getString('selectedBackgroundId');
  return persisted && CDN_BACKGROUNDS.has(persisted) ? persisted : 'bg_munich.jpg';
}

interface AvatarStore {
  avatarOptions: AvatarOption[];
  selectedAvatarId: string;
  selectedVoiceId: string | null;
  selectedEmotionId: string;
  selectedBackgroundId: string;
  activeBgCategory: 'scenes' | 'cities' | null;
  isSelectorOpen: boolean;

  setAvatarOptions: (options: AvatarOption[]) => void;
  setSelectedAvatarId: (id: string) => void;
  setSelectedVoiceId: (id: string | null) => void;
  setSelectedEmotionId: (id: string) => void;
  setSelectedBackgroundId: (id: string) => void;
  setActiveBgCategory: (cat: 'scenes' | 'cities' | null) => void;
  setIsSelectorOpen: (open: boolean) => void;
}

export const useAvatarStore = create<AvatarStore>((set) => ({
  avatarOptions: [],
  selectedAvatarId: DEFAULT_AVATAR_ID,
  selectedVoiceId: null,
  selectedEmotionId: 'happy',
  selectedBackgroundId: getPersistedBackground(),
  activeBgCategory: null,
  isSelectorOpen: false,

  setAvatarOptions: (options) => set({ avatarOptions: options }),
  setSelectedAvatarId: (id) => set({ selectedAvatarId: id }),
  setSelectedVoiceId: (id) => set({ selectedVoiceId: id }),
  setSelectedEmotionId: (id) => set({ selectedEmotionId: id }),
  setSelectedBackgroundId: (id) => {
    mmkvStorage.setString('selectedBackgroundId', id);
    set({ selectedBackgroundId: id });
  },
  setActiveBgCategory: (cat) => set({ activeBgCategory: cat }),
  setIsSelectorOpen: (open) => set({ isSelectorOpen: open }),
}));
