import { ConversationState } from '@/store/slices/conversationTypes';

export const createConversationPayload = (
  state: ConversationState,
  source: string,
  questionIndex: number,
) => ({
  session_id: state.sessionId,
  conversation_id: state.activeConversationId,
  question_index_in_conversation: questionIndex,
  max_questions: state.maxQuestionsPerConversation,
  source,
});