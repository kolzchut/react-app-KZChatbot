import appConfig from '@/config/config.json';
import { ConversationState } from '@/store/slices/conversationTypes';

const conversationStateKey = appConfig.storageKeys.conversationState;

export const getConversationSessionConfig = (config: typeof window.KZChatbotConfig) => ({
  maxQuestionsPerConversation:
    config.maxQuestionsPerConversation || appConfig.defaults.maxQuestionsPerConversation,
  sessionTtlHours:
    config.conversationSessionTtlHours || appConfig.defaults.conversationSessionTtlHours,
});

export const saveConversationState = (state: ConversationState): void => {
  localStorage.setItem(conversationStateKey, JSON.stringify(state));
};

export const loadConversationState = (): ConversationState | null => {
  const serialized = localStorage.getItem(conversationStateKey);
  if (!serialized) return null;
  return JSON.parse(serialized) as ConversationState;
};

export const clearConversationState = (): void => {
  localStorage.removeItem(conversationStateKey);
};

export const isSessionExpired = (state: ConversationState): boolean => {
  if (!state.sessionExpiresAt) return true;
  return Date.now() > state.sessionExpiresAt;
};

export const getSessionExpirationTimestamp = (ttlHours: number): number =>
  Date.now() + ttlHours * 60 * 60 * 1000;