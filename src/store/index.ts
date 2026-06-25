import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import questionReducer from './slices/questionSlice';
import conversationReducer from './slices/conversationSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    question: questionReducer,
    conversation: conversationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
