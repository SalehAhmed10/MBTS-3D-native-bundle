import { create } from 'zustand';
import type {
  ChatMessage,
  ConversationTurn,
  ChatStep,
  CandidateUser,
  AuthProperty,
  SpeechQueueItem,
} from '@/types/chat';

const AUTH_PROPERTIES: AuthProperty[] = [
  'favoriteColor',
  'homeCountry',
  'homeState',
  'mothersMaidenName',
];

interface ChatStore {
  messages: ChatMessage[];
  speechQueue: SpeechQueueItem[];
  conversationHistory: ConversationTurn[];
  chatStep: ChatStep;
  input: string;
  isReplying: boolean;
  guestName: string;
  authenticated: boolean;
  person: CandidateUser | null;
  users: CandidateUser[];
  authProperties: AuthProperty[];
  currentAuthProp: AuthProperty | null;
  srxState: unknown;

  addMessage: (msg: ChatMessage) => void;
  addSpeechItem: (item: SpeechQueueItem) => void;
  advanceSpeechQueue: () => void;
  appendHistory: (turn: ConversationTurn) => void;
  setConversationHistory: (history: ConversationTurn[]) => void;
  setChatStep: (step: ChatStep) => void;
  setInput: (text: string) => void;
  setIsReplying: (replying: boolean) => void;
  setGuestName: (name: string) => void;
  setAuthenticated: (auth: boolean) => void;
  setPerson: (person: CandidateUser | null) => void;
  setUsers: (users: CandidateUser[]) => void;
  setAuthProperties: (props: AuthProperty[]) => void;
  setCurrentAuthProp: (prop: AuthProperty | null) => void;
  setSrxState: (state: unknown) => void;
  resetAuthFlow: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  speechQueue: [],
  conversationHistory: [{ role: 'assistant', content: "Hello, I'm Camille. What's your name?\nPlease enter it below." }],
  chatStep: 'name',
  input: '',
  isReplying: false,
  guestName: '',
  authenticated: false,
  person: null,
  users: [],
  authProperties: AUTH_PROPERTIES,
  currentAuthProp: null,
  srxState: null,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  addSpeechItem: (item) => set((s) => ({ speechQueue: [...s.speechQueue, item] })),
  advanceSpeechQueue: () => set((s) => ({ speechQueue: s.speechQueue.slice(1) })),
  appendHistory: (turn) => set((s) => ({ conversationHistory: [...s.conversationHistory, turn] })),
  setConversationHistory: (history) => set({ conversationHistory: history }),
  setChatStep: (step) => set({ chatStep: step }),
  setInput: (text) => set({ input: text }),
  setIsReplying: (replying) => set({ isReplying: replying }),
  setGuestName: (name) => set({ guestName: name }),
  setAuthenticated: (auth) => set({ authenticated: auth }),
  setPerson: (person) => set({ person }),
  setUsers: (users) => set({ users }),
  setAuthProperties: (props) => set({ authProperties: props }),
  setCurrentAuthProp: (prop) => set({ currentAuthProp: prop }),
  setSrxState: (state) => set({ srxState: state }),
  resetAuthFlow: () => set({
    chatStep: 'name',
    guestName: '',
    authenticated: false,
    person: null,
    users: [],
    authProperties: AUTH_PROPERTIES,
    currentAuthProp: null,
  }),
}));
