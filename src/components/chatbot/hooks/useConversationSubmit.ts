import { useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { pushAnalyticsEvent } from '@/lib/analytics';
import { askQuestion } from '../chatbotApi';
import { appendBotMessage, appendSystemMessage, appendUserMessage, markQuotaReached } from '@/store/slices/conversationSlice';
import { createConversationPayload } from '../chatbotAnalytics';
import { MessageType } from '@/types';
import { getConversationSessionConfig } from '@/lib/sessionStorage';

interface UseConversationSubmitProps {
  config: typeof window.KZChatbotConfig | null;
  question: string;
  source: string;
  conversationState: { sessionId: string; activeConversationId: string; maxQuestionsPerConversation: number };
  activeQuestionCount: number;
  quotaReached: boolean;
  dispatch: (action: unknown) => void;
  resetQuestion: () => void;
  onLoading: (isLoading: boolean) => void;
  t: (key: never) => string;
}

export const useConversationSubmit = ({ config, question, source, conversationState, activeQuestionCount, quotaReached, dispatch, resetQuestion, onLoading, t }: UseConversationSubmitProps) => {
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
    onLoading(true);
    dispatch(appendUserMessage({ id: uuidv4(), type: MessageType.User, content: nextQuestion }));
    pushAnalyticsEvent('question_asked', source, conversationPayload(activeQuestionCount + 1));
    resetQuestion();

    try {
      const answer = await askQuestion(config, {
        text: nextQuestion,
        uuid: config.uuid,
        referrer: config.referrer || '',
        sessionId: conversationState.sessionId,
        conversationId: conversationState.activeConversationId,
        questionIndex: activeQuestionCount + 1,
      });

      dispatch(appendBotMessage({ id: answer.conversationId || uuidv4(), type: MessageType.Bot, content: answer.llmResult, links: answer.docs }));
      pushAnalyticsEvent('answer_received', null, conversationPayload(activeQuestionCount + 1));
      if (activeQuestionCount + 1 >= maxQuestionsPerConversation) appendQuotaMessage();
    } catch (error) {
      dispatch(appendBotMessage({ id: uuidv4(), type: MessageType.Error, content: t('general_error' as never) }));
      const errorLabel = error instanceof Error ? error.message.replace(':', ': ') : 'submit_failed';
      pushAnalyticsEvent('error_received', errorLabel);
    } finally {
      inFlightRef.current = false;
      pendingQuestionRef.current = '';
      onLoading(false);
    }
  }, [question, config, quotaReached, activeQuestionCount, conversationState, source, appendQuotaMessage, dispatch, resetQuestion, onLoading, t]);

  useEffect(() => {
    if (question.trim()) submitQuestion();
  }, [question, submitQuestion]);
};
