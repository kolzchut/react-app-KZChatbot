import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, MessageType } from '@/types';
import type { RootState } from '@/store';
import { ConversationState, SessionInitPayload } from './conversationTypes';
import { createConversationItem, hasUserQuestion, incrementQuestionCount, withTimestamp } from './conversationUtils';

const now = Date.now();
const initialConversationId = `conversation-${now}`;
const emptyArchivedConversations: ConversationState['conversations'] = [];

const initialState: ConversationState = {
  sessionId: '',
  sessionExpiresAt: 0,
  activeConversationId: initialConversationId,
  isViewingArchive: false,
  maxQuestionsPerConversation: 0,
  conversations: [createConversationItem(initialConversationId, now)],
};

const findConversation = (state: ConversationState, id: string) =>
  state.conversations.find((item) => item.id === id);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    initSession: (state, action: PayloadAction<SessionInitPayload>) => {
      state.sessionId = action.payload.sessionId;
      state.sessionExpiresAt = action.payload.sessionExpiresAt;
      state.maxQuestionsPerConversation = action.payload.maxQuestionsPerConversation;
    },
    hydrateFromStorage: (_, action: PayloadAction<ConversationState>) => action.payload,
    appendUserMessage: (state, action: PayloadAction<Message>) => {
      const active = findConversation(state, state.activeConversationId);
      if (!active) return;
      const message = withTimestamp(action.payload, active.id);
      active.messages.push(message);
      active.questionCount = incrementQuestionCount(message, active.questionCount);
      active.updatedAt = message.timestamp || Date.now();
    },
    appendBotMessage: (state, action: PayloadAction<Message>) => {
      const active = findConversation(state, state.activeConversationId);
      if (!active) return;
      const message = withTimestamp(action.payload, active.id);
      active.messages.push(message);
      active.updatedAt = message.timestamp || Date.now();
    },
    appendSystemMessage: (state, action: PayloadAction<Message>) => {
      const active = findConversation(state, state.activeConversationId);
      if (!active) return;
      const message = withTimestamp({ ...action.payload, type: MessageType.System }, active.id);
      active.messages.push(message);
      active.updatedAt = message.timestamp || Date.now();
    },
    replaceActiveMessages: (state, action: PayloadAction<Message[]>) => {
      const active = findConversation(state, state.activeConversationId);
      if (active) active.messages = action.payload;
    },
    archiveActiveConversation: (state) => {
      const active = findConversation(state, state.activeConversationId);
      if (active) active.archived = hasUserQuestion(active);
    },
    startNewConversation: (state, action: PayloadAction<{ conversationId: string; timestamp: number }>) => {
      const active = findConversation(state, state.activeConversationId);
      if (active) active.archived = hasUserQuestion(active);
      state.activeConversationId = action.payload.conversationId;
      state.isViewingArchive = false;
      state.conversations.push(createConversationItem(action.payload.conversationId, action.payload.timestamp));
    },
    setViewingArchive: (state, action: PayloadAction<boolean>) => {
      state.isViewingArchive = action.payload;
    },
    markQuotaReached: (state) => {
      const active = findConversation(state, state.activeConversationId);
      if (active) active.quotaReached = true;
    },
    clearAllHistory: () => initialState,
  },
});

export const { initSession, hydrateFromStorage, appendUserMessage, appendBotMessage, appendSystemMessage, replaceActiveMessages, startNewConversation, archiveActiveConversation, setViewingArchive, markQuotaReached, clearAllHistory } = conversationSlice.actions;
const getConversationState = (state: RootState) => state.conversation || initialState;

export const selectConversationState = (state: RootState) => getConversationState(state);
export const selectActiveConversation = (state: RootState) => {
  const current = getConversationState(state);
  return current.conversations.find((item) => item.id === current.activeConversationId);
};
export const selectArchivedConversations = (state: RootState) =>
  getConversationState(state).conversations.some((item) => item.archived)
    ? getConversationState(state).conversations.filter((item) => item.archived)
    : emptyArchivedConversations;

export default conversationSlice.reducer;
