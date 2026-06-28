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

/** True for a localStorage write that failed because the quota is exhausted. */
const isQuotaError = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22);

/**
 * Returns a copy of the state with the oldest archived conversation removed,
 * or null when there is no archived conversation left to drop. The conversations
 * array is append-ordered, so the first archived entry is the oldest.
 */
const dropOldestArchived = (state: ConversationState): ConversationState | null => {
  const index = state.conversations.findIndex((conversation) => conversation.archived);
  if (index === -1) return null;
  return {
    ...state,
    conversations: state.conversations.filter((_, i) => i !== index),
  };
};

export const saveConversationSnapshot = (
  state: ConversationState,
  isLoading: boolean,
  tabId: string,
): void => {
  let snapshot: ConversationSnapshot = {
    conversationState: state,
    isLoading,
    lastUpdatedBy: tabId,
    lastUpdatedAt: Date.now(),
  };

  // Retry on quota errors by pruning the oldest archived conversations from a
  // local copy of the snapshot. This effect runs on every state change, so it
  // must never throw — give up quietly once nothing is left to prune.
  for (;;) {
    try {
      localStorage.setItem(conversationStateKey, JSON.stringify(snapshot));
      return;
    } catch (error) {
      if (!isQuotaError(error)) throw error;

      const pruned = dropOldestArchived(snapshot.conversationState);
      if (!pruned) {
        console.warn('conversation snapshot exceeds storage quota; skipping save');
        return;
      }
      snapshot = { ...snapshot, conversationState: pruned };
    }
  }
};

export const loadConversationSnapshot = (): ConversationSnapshot | null => {
  const serialized = localStorage.getItem(conversationStateKey);
  if (!serialized) return null;
  try {
    return JSON.parse(serialized) as ConversationSnapshot;
  } catch {
    // Corrupt or legacy JSON — drop it so callers start fresh instead of throwing.
    localStorage.removeItem(conversationStateKey);
    return null;
  }
};
