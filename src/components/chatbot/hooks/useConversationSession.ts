import { useEffect, useRef } from 'react';
import { pushAnalyticsEvent } from '@/lib/analytics';
import { clearConversationState, isSessionExpired, loadConversationState, saveConversationState } from '@/lib/sessionStorage';
import { createCrossTabSync } from '@/lib/crossTabSync';
import { appendBotMessage, clearAllHistory, hydrateFromStorage, initSession, startNewConversation } from '@/store/slices/conversationSlice';
import { ConversationItem, ConversationState } from '@/store/slices/conversationTypes';
import { createConversationPayload } from '../chatbotAnalytics';
import { createConversationId, createInitialMessage, createSessionInitPayload } from '../chatbotSession';

interface UseConversationSessionProps {
  config: typeof window.KZChatbotConfig | null;
  state: ConversationState;
  activeConversation?: ConversationItem;
  t: (key: never) => string;
  dispatch: (action: unknown) => void;
}

export const useConversationSession = ({ config, state, activeConversation, t, dispatch }: UseConversationSessionProps) => {
  const syncRef = useRef<ReturnType<typeof createCrossTabSync> | null>(null);
  const remoteRef = useRef(false);

  useEffect(() => {
    if (!config) return;
    try {
      const stored = loadConversationState();
      if (stored && !isSessionExpired(stored)) dispatch(hydrateFromStorage(stored));
      if (!stored || isSessionExpired(stored)) dispatch(initSession(createSessionInitPayload(config)));
    } catch {
      dispatch(initSession(createSessionInitPayload(config)));
    }
  }, [config, dispatch]);

  useEffect(() => {
    const hasAnyMessages = state.conversations.some((item) => item.messages.length > 0);
    if (!config || !activeConversation || activeConversation.messages.length > 0 || hasAnyMessages) return;
    dispatch(appendBotMessage(createInitialMessage(config, t)));
  }, [activeConversation, config, dispatch, state.conversations, t]);

  useEffect(() => {
    if (!config?.enableCrossTabSync) return;
    syncRef.current = createCrossTabSync(() => {
      const next = loadConversationState();
      if (!next || isSessionExpired(next)) return;
      remoteRef.current = true;
      dispatch(hydrateFromStorage(next));
    });
    return () => syncRef.current?.dispose();
  }, [config?.enableCrossTabSync, dispatch]);

  useEffect(() => {
    saveConversationState(state);
    if (remoteRef.current) remoteRef.current = false;
    else syncRef.current?.publish({ name: 'new-message', timestamp: Date.now() });
  }, [state]);

  const handleStartNewConversation = (source: string) => {
    dispatch(startNewConversation({ conversationId: createConversationId(), timestamp: Date.now() }));
    pushAnalyticsEvent('new_conversation_clicked', null, createConversationPayload(state, source, 0));
    syncRef.current?.publish({ name: 'new-conversation', timestamp: Date.now() });
  };

  const handleClearAllHistory = () => {
    dispatch(clearAllHistory());
    clearConversationState();
    pushAnalyticsEvent('history_deleted_confirmed', null, createConversationPayload(state, 'popup', 0));
    syncRef.current?.publish({ name: 'clear-history', timestamp: Date.now() });
  };

  return { handleStartNewConversation, handleClearAllHistory };
};