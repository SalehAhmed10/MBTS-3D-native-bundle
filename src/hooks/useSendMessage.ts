import { useMutation } from '@tanstack/react-query';
import { useChatStore } from '@/stores/chatStore';
import { useAvatarStore } from '@/stores/avatarStore';
import type { ChatApiResponse, ConversationTurn } from '@/types/chat';

const CHAT_API_URL = 'https://www.chatcamille.ai/api/chat';

export function useSendMessage() {
  return useMutation({
    mutationFn: async (nextMessage: string): Promise<ChatApiResponse> => {
      const {
        conversationHistory,
        guestName,
        authenticated,
        person,
        srxState,
        setConversationHistory,
      } = useChatStore.getState();

      const { avatarOptions, selectedAvatarId } = useAvatarStore.getState();
      const selectedAvatar = avatarOptions.find((a) => a.id === selectedAvatarId);
      const avatarLabel = selectedAvatar?.label ?? selectedAvatarId;

      const updatedHistory: ConversationTurn[] = [
        ...conversationHistory,
        { role: 'user', content: nextMessage },
      ];

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: nextMessage,
          avatar: avatarLabel,
          userId: person?._id ?? null,
          userName: guestName || 'Guest',
          sessionName: guestName || 'Guest',
          authenticated,
          conversationHistory: updatedHistory,
          packages: person?.user?.packages ?? [],
          srxState,
          srxType: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`BOTCierge request failed with ${response.status}`);
      }

      const json = (await response.json().catch(() => ({}))) as ChatApiResponse;

      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: json.reply ?? '' },
      ]);

      return json;
    },
  });
}
