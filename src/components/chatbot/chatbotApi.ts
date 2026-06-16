import { Answer } from '@/types';

const getQuestionEndpoint = (config: typeof window.KZChatbotConfig | null): string => {
  if (import.meta.env.MODE === 'production') return `${config?.restPath}/kzchatbot/v0/question`;
  return '/api/kzchatbot/v0/question';
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeDocs = (docs: unknown): Answer['docs'] => {
  if (!Array.isArray(docs)) return [];

  return docs
    .filter(isRecord)
    .map((doc) => ({
      title: String(doc.title || ''),
      url: String(doc.url || ''),
    }))
    .filter((doc) => doc.title || doc.url);
};

const normalizeAnswer = (data: unknown, fallbackConversationId: string): Answer => {
  if (!isRecord(data)) {
    return { llmResult: '', docs: [], conversationId: fallbackConversationId };
  }

  const nestedData = isRecord(data.data) ? data.data : null;
  const response = nestedData || data;
  const answer = isRecord(response.answer) ? response.answer : response;
  const answerText =
    (isRecord(answer) && typeof answer.answer === 'string' && answer.answer) ||
    (typeof response.answer === 'string' && response.answer) ||
    (typeof response.llm_answer === 'string' && response.llm_answer) ||
    (typeof response.llmResult === 'string' && response.llmResult) ||
    (typeof data.llm_answer === 'string' && data.llm_answer) ||
    (typeof data.llmResult === 'string' && data.llmResult) ||
    '';

  const conversationId =
    (typeof response.conversation_id === 'string' && response.conversation_id) ||
    (typeof response.conversationId === 'string' && response.conversationId) ||
    (typeof data.conversation_id === 'string' && data.conversation_id) ||
    (typeof data.conversationId === 'string' && data.conversationId) ||
    fallbackConversationId;

  return {
    llmResult: answerText,
    docs: normalizeDocs(response.docs || data.docs),
    conversationId,
  };
};

export const askQuestion = async (
  config: typeof window.KZChatbotConfig | null,
  payload: Record<string, unknown>,
): Promise<Answer> => {
  const response = await fetch(getQuestionEndpoint(config), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = isRecord(data) ? data.message || data.error : null;
    throw new Error(`${response.status}:${message || response.statusText}`);
  }

  return normalizeAnswer(data, String(payload.conversationId || payload.thread_id || ''));
};
