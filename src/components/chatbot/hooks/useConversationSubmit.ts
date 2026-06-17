import { useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { pushAnalyticsEvent } from '@/lib/analytics';
import { askQuestion } from '../chatbotApi';
import { appendBotMessage, appendSystemMessage, appendUserMessage, markQuotaReached, setConversationThreadId } from '@/store/slices/conversationSlice';
import { setLoading } from '@/store/slices/chatSlice';
import { createConversationPayload } from '../chatbotAnalytics';
import { MessageType } from '@/types';
import { getConversationSessionConfig } from '@/lib/sessionStorage';

interface UseConversationSubmitProps {
  config: typeof window.KZChatbotConfig | null;
  question: string;
  source: string;
  conversationState: { sessionId: string; activeConversationId: string; maxQuestionsPerConversation: number };
  activeThreadId?: string;
  activeQuestionCount: number;
  quotaReached: boolean;
  dispatch: (action: unknown) => void;
  resetQuestion: () => void;
  t: (key: never) => string;
}

export const useConversationSubmit = ({ config, question, source, conversationState, activeThreadId, activeQuestionCount, quotaReached, dispatch, resetQuestion, t }: UseConversationSubmitProps) => {
  const inFlightRef = useRef(false);
  const pendingQuestionRef = useRef('');

  const appendQuotaMessage = useCallback(() => {
    dispatch(markQuotaReached());
    dispatch(appendSystemMessage({ id: uuidv4(), type: MessageType.System, content: t('quota_reached_message' as never), systemAction: 'quota_reached' }));
  }, [dispatch, t]);

  const submitQuestion = useCallback(async () => {
    const nextQuestion = question.trim();
    if (!nextQuestion || !config?.uuid || config.chatbotIsShown !== true || !config.slugs) return;
    if (inFlightRef.current && pendingQuestionRef.current === nextQuestion) return;

    const maxQuestionsPerConversation =
      conversationState.maxQuestionsPerConversation || getConversationSessionConfig(config).maxQuestionsPerConversation;
    const conversationPayload = (questionIndex: number) => ({
      ...createConversationPayload(conversationState as never, source, questionIndex),
      max_questions: maxQuestionsPerConversation,
    });

    if (quotaReached || activeQuestionCount >= maxQuestionsPerConversation) {
      appendQuotaMessage();
      pushAnalyticsEvent('quota_reached', null, conversationPayload(activeQuestionCount));
      resetQuestion();
      return;
    }

    inFlightRef.current = true;
    pendingQuestionRef.current = nextQuestion;
    dispatch(setLoading(true));
    dispatch(appendUserMessage({ id: uuidv4(), type: MessageType.User, content: nextQuestion }));
    pushAnalyticsEvent('question_asked', source, conversationPayload(activeQuestionCount + 1));
    resetQuestion();

    const conversationId = conversationState.activeConversationId;

    try {
      const answer = await askQuestion(config, {
        query: nextQuestion,
        // referrer (the page id) is what the middleware turns into asked_from
        // and page_id for the RAG, mirroring ApiKZChatbotSubmitQuestion.
        referrer: config.referrer,
        send_complete_pages_to_llm: false,
        include_debug_data: false,
        // uuid lets the shim mint a per-user-namespaced thread_id on the first
        // turn; thread_id is empty for a new thread and carried thereafter.
        uuid: config.uuid,
        thread_id: activeThreadId || '',
        execution_flags: {
          llm_judge: true,
          retrieval: true,
          llm_answer: true,
        },
      });

      // Adopt the thread_id the backend minted for a brand-new thread.
      const turnThreadId = activeThreadId || answer.threadId;
      if (!activeThreadId && answer.threadId) {
        dispatch(setConversationThreadId({ conversationId, threadId: answer.threadId }));
      }

      // The bot message carries its thread so rating can address it without
      // reaching back into the store.
      dispatch(appendBotMessage({ id: answer.conversationId || uuidv4(), type: MessageType.Bot, content: answer.llmResult, links: answer.docs, threadId: turnThreadId }));
      pushAnalyticsEvent('answer_received', null, conversationPayload(activeQuestionCount + 1));
      if (activeQuestionCount + 1 >= maxQuestionsPerConversation) appendQuotaMessage();
    } catch (error) {
      dispatch(appendBotMessage({ id: uuidv4(), type: MessageType.Error, content: t('general_error' as never) }));
      const errorLabel = error instanceof Error ? error.message.replace(':', ': ') : 'submit_failed';
      pushAnalyticsEvent('error_received', errorLabel);
    } finally {
      inFlightRef.current = false;
      pendingQuestionRef.current = '';
      dispatch(setLoading(false));
    }
  }, [question, config, quotaReached, activeQuestionCount, conversationState, activeThreadId, source, appendQuotaMessage, dispatch, resetQuestion, t]);

  useEffect(() => {
    if (question.trim()) submitQuestion();
  }, [question, submitQuestion]);
};
