export type ChatMessage = {
  id: string;
  message: string;
  me: boolean;
};

export type SpeechQueueItem = {
  id: string;
  text: string;
};

export type ConversationTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type AuthProperty =
  | 'favoriteColor'
  | 'homeCountry'
  | 'homeState'
  | 'mothersMaidenName';

export type CandidateUser = {
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

export type IntentResponse = {
  type?: string;
  message?: string;
  data?: CandidateUser[];
  newMessage?: string;
};

export type PersonResponse = {
  status?: string;
  type?: string;
  data?: CandidateUser;
};

export type ChatApiResponse = {
  reply?: string;
  emotion?: string;
  type?: string;
  data?: unknown;
  srxState?: unknown;
};

export type ChatStep = 'name' | 'intent' | 'auth';
