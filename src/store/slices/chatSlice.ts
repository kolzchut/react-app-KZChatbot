import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface ChatState {
  isChatOpen: boolean;
  isLoading: boolean;
}

const initialState: ChatState = {
  isChatOpen: false,
  isLoading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    openChat: (state) => {
      state.isChatOpen = true;
    },
    closeChat: (state) => {
      state.isChatOpen = false;
    },
    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { openChat, closeChat, toggleChat, setLoading } = chatSlice.actions;

export const selectIsChatOpen = (state: RootState) => state.chat.isChatOpen;
export const selectIsLoading = (state: RootState) => state.chat.isLoading;

export default chatSlice.reducer;
