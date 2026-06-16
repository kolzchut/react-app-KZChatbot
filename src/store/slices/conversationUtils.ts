import { Message, MessageType } from '@/types';
import { ConversationItem } from './conversationTypes';

export const createConversationItem = (
  conversationId: string,
  timestamp: number,
): ConversationItem => ({
  id: conversationId,
  archived: false,
  quotaReached: false,
  questionCount: 0,
  createdAt: timestamp,
  updatedAt: timestamp,
  messages: [],
});

export const withTimestamp = (message: Message, conversationId: string): Message => ({
  ...message,
  conversationId,
  timestamp: message.timestamp || Date.now(),
});

export const incrementQuestionCount = (
  message: Message,
  questionCount: number,
): number => (message.type === MessageType.User ? questionCount + 1 : questionCount);

export const hasUserQuestion = (conversation?: ConversationItem): boolean =>
  Boolean(conversation?.messages.some((item) => item.type === MessageType.User));