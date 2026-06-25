import appConfig from '@/config/config.json';
import { ConversationState } from '@/store/slices/conversationTypes';

const conversationStateKey = appConfig.storageKeys.conversationState;

/** Snapshot persisted to localStorage — includes metadata for cross-tab sync. */
export interface ConversationSnapshot {
  conversationState: ConversationState;
  isLoading: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: number;
}

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
