import { useEffect, useState } from 'react';
import { pushAnalyticsEvent } from '@/lib/analytics';
import { clearConversationState, getConversationSessionConfig, loadConversationState, pruneExpiredConversations } from '@/lib/sessionStorage';
import { saveConversationSnapshot } from '@/lib/conversationSnapshot';
import { crossTabSyncService } from '@/lib/crossTabSyncService';
import { appendBotMessage, clearAllHistory, hydrateFromStorage, initSession, startNewConversation } from '@/store/slices/conversationSlice';
import { ConversationItem, ConversationState } from '@/store/slices/conversationTypes';
import { createConversationItem } from '@/store/slices/conversationUtils';
import { createConversationPayload } from '../chatbotAnalytics';
import { createConversationId, createInitialMessage, createSessionInitPayload } from '../chatbotSession';
import { StringKey } from '@/i18n/types';

interface UseConversationSessionProps {
  config: typeof window.KZChatbotConfig | null;
  state: ConversationState;
  activeConversation?: ConversationItem;
  isLoading: boolean;
  t: (key: StringKey) => string;
  dispatch: (action: unknown) => void;
}

const prepareStoredConversationState = (
  stored: ConversationState,
  config: typeof window.KZChatbotConfig,
): ConversationState | null => {
  const now = Date.now();
  const settings = getConversationSessionConfig(config);
  const session = createSessionInitPayload(config);
  const pruned = pruneExpiredConversations(stored, settings.sessionTtlHours, now);

  if (pruned.conversations.length === 0) return null;

  const hasActiveConversation = pruned.conversations.some(
    (conversation) => conversation.id === pruned.activeConversationId && !conversation.archived,
  );

  if (hasActiveConversation) {
    return {
      ...pruned,
      sessionId: pruned.sessionId || session.sessionId,
      sessionExpiresAt: session.sessionExpiresAt,
      maxQuestionsPerConversation: session.maxQuestionsPerConversation,
    };
  }

  const conversationId = createConversationId();
  return {
    ...pruned,
    sessionId: pruned.sessionId || session.sessionId,
    sessionExpiresAt: session.sessionExpiresAt,
    activeConversationId: conversationId,
    maxQuestionsPerConversation: session.maxQuestionsPerConversation,
    conversations: [
      ...pruned.conversations,
      createConversationItem(conversationId, now),
    ],
  };
};

export const useConversationSession = ({ config, state, activeConversation, isLoading, t, dispatch }: UseConversationSessionProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!config) return;
    try {
      const stored = loadConversationState();
      const prepared = stored ? prepareStoredConversationState(stored, config) : null;

      if (prepared) {
        dispatch(hydrateFromStorage(prepared));
      } else {
        if (stored) clearConversationState();
        dispatch(initSession(createSessionInitPayload(config)));
      }
    } catch {
      dispatch(initSession(createSessionInitPayload(config)));
    } finally {
      setIsInitialized(true);
    }
  }, [config, dispatch]);

  useEffect(() => {
    const stored = loadConversationState();
    if (config && !stored?.conversations.length && !activeConversation?.messages.length)
    dispatch(appendBotMessage(createInitialMessage(config, t)));
  }, [activeConversation, config, dispatch, isInitialized, t]);

  // Persist conversation state + loading flag to localStorage.
  // The cross-tab sync service (crossTabSyncService) listens for remote changes.
  useEffect(() => {
    if (!isInitialized || !config) return;
    saveConversationSnapshot(state, isLoading, crossTabSyncService.getTabId());
  }, [config, isInitialized, state, isLoading]);

  const handleStartNewConversation = (source: string) => {
    dispatch(startNewConversation({ conversationId: createConversationId(), timestamp: Date.now() }));
    pushAnalyticsEvent('new_conversation_clicked', null, createConversationPayload(state, source, 0));
  };

  const handleClearAllHistory = () => {
    dispatch(clearAllHistory());
    clearConversationState();
    pushAnalyticsEvent('history_deleted_confirmed', null, createConversationPayload(state, 'popup', 0));
  };

  return { handleStartNewConversation, handleClearAllHistory };
};
