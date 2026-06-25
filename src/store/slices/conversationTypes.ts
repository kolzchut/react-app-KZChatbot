import { Message } from '@/types';

export interface ConversationItem {
  id: string;
  /** RAG-minted thread id for this conversation; carried across all its turns. */
  threadId?: string;
  archived: boolean;
  quotaReached: boolean;
  questionCount: number;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface ConversationState {
  sessionId: string;
  sessionExpiresAt: number;
  activeConversationId: string;
  isViewingArchive: boolean;
  maxQuestionsPerConversation: number;
  conversations: ConversationItem[];
}

export interface SessionInitPayload {
  sessionId: string;
  sessionExpiresAt: number;
  maxQuestionsPerConversation: number;
}