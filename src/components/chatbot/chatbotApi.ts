import { Answer } from '@/types';

const getQuestionEndpoint = (config: typeof window.KZChatbotConfig | null): string => {
  if (import.meta.env.MODE === 'production') return `${config?.restPath}/kzchatbot/v0/question`;
  return '/api/kzchatbot/v0/question';
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
  if (!response.ok) throw new Error(`${response.status}:${data.message}`);
  return data as Answer;
};