import { v4 as uuidv4 } from 'uuid';
import { Message, MessageType } from '@/types';
import { FORMATTED_SLUGS } from '@/i18n';
import { StringKey } from '@/i18n/types';
import { getConversationSessionConfig, getSessionExpirationTimestamp } from '@/lib/sessionStorage';

export const createSessionInitPayload = (config: typeof window.KZChatbotConfig) => {
  const settings = getConversationSessionConfig(config);
  return {
    sessionId: uuidv4(),
    sessionExpiresAt: getSessionExpirationTimestamp(settings.sessionTtlHours),
    maxQuestionsPerConversation: settings.maxQuestionsPerConversation,
  };
};

export const createInitialMessage = (config: typeof window.KZChatbotConfig, t: (key: StringKey) => string): Message => {
  const hasQuota = config.questionsPermitted > 0;
  const content = hasQuota ? t('welcome_message') : t('questions_daily_limit');
  return {
    id: uuidv4(),
    type: MessageType.StartBot,
    content,
    formattedContent: hasQuota && FORMATTED_SLUGS.has('welcome_message'),
    timestamp: Date.now(),
  };
};

export const createConversationId = (): string => `conversation-${Date.now()}-${uuidv4()}`;