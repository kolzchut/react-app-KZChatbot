import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../index';

interface ChatState {
  isChatOpen: boolean;
}

const initialState: ChatState = {
  isChatOpen: false,
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
  },
});

export const { openChat, closeChat, toggleChat } = chatSlice.actions;

export const selectIsChatOpen = (state: RootState) => state.chat.isChatOpen;

export default chatSlice.reducer;