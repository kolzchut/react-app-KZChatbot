import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import questionReducer from './slices/questionSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    question: questionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
