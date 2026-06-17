import appConfig from '@/config/config.json';
import { ConversationItem, ConversationState } from '@/store/slices/conversationTypes';

const conversationStateKey = appConfig.storageKeys.conversationState;

/** Snapshot persisted to localStorage — includes metadata for cross-tab sync. */
export interface ConversationSnapshot {
  conversationState: ConversationState;
  isLoading: boolean;
  lastUpdatedBy: string;   // tab UUID — lets us ignore our own writes
  lastUpdatedAt: number;
}

export const getConversationSessionConfig = (config: typeof window.KZChatbotConfig) => ({
  maxQuestionsPerConversation:
    config.maxQuestionsPerConversation || appConfig.defaults.maxQuestionsPerConversation,
  sessionTtlHours:
    config.conversationSessionTtlHours || appConfig.defaults.conversationSessionTtlHours,
});

export const saveConversationSnapshot = (
  state: ConversationState,
  isLoading: boolean,
  tabId: string,
): void => {
  const snapshot: ConversationSnapshot = {
    conversationState: state,
    isLoading,
    lastUpdatedBy: tabId,
    lastUpdatedAt: Date.now(),
  };
  localStorage.setItem(conversationStateKey, JSON.stringify(snapshot));
};

export const loadConversationSnapshot = (): ConversationSnapshot | null => {
  const serialized = localStorage.getItem(conversationStateKey);
  if (!serialized) return null;
  return JSON.parse(serialized) as ConversationSnapshot;
};

/** Unwraps the saved snapshot to get the ConversationState. */
export const loadConversationState = (): ConversationState | null => {
  const serialized = localStorage.getItem(conversationStateKey);
  if (!serialized) return null;
  try {
    const parsed = JSON.parse(serialized);
    // Snapshot format (current)
    if (parsed.conversationState) return parsed.conversationState as ConversationState;
    // Legacy format (plain ConversationState) — shouldn't exist, but be safe
    return parsed as ConversationState;
  } catch {
    return null;
  }
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

const ttlToMilliseconds = (ttlHours: number): number => ttlHours * 60 * 60 * 1000;

const getConversationTimestamp = (conversation: ConversationItem): number => {
  const latestMessageTimestamp = conversation.messages.reduce(
    (latest, message) => Math.max(latest, message.timestamp || 0),
    0,
  );

  return conversation.updatedAt || latestMessageTimestamp || conversation.createdAt || 0;
};

export const isConversationExpired = (
  conversation: ConversationItem,
  ttlHours: number,
  now = Date.now(),
): boolean => {
  const timestamp = getConversationTimestamp(conversation);
  if (!timestamp) return true;
  return now - timestamp >= ttlToMilliseconds(ttlHours);
};

export const pruneExpiredConversations = (
  state: ConversationState,
  ttlHours: number,
  now = Date.now(),
): ConversationState => {
  const conversations = state.conversations.filter(
    (conversation) => !isConversationExpired(conversation, ttlHours, now),
  );

  if (conversations.length === 0) {
    return {
      ...state,
      activeConversationId: '',
      isViewingArchive: false,
      conversations: [],
    };
  }

  const activeConversationExists = conversations.some(
    (conversation) => conversation.id === state.activeConversationId,
  );
  const latestActiveConversation = [...conversations]
    .reverse()
    .find((conversation) => !conversation.archived);

  return {
    ...state,
    activeConversationId: activeConversationExists
      ? state.activeConversationId
      : latestActiveConversation?.id || conversations[conversations.length - 1].id,
    isViewingArchive: false,
    conversations,
  };
};
