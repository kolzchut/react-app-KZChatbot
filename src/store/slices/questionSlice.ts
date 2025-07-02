import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

interface QuestionState {
  question: string;
}

const initialState: QuestionState = {
  question: '',
};

const questionSlice = createSlice({
  name: 'question',
  initialState,
  reducers: {
    setQuestion: (state, action: PayloadAction<string>) => {
      state.question = action.payload;
    },
    resetQuestion: (state) => {
      state.question = '';
    },
  },
});

export const { setQuestion, resetQuestion } = questionSlice.actions;

export const selectQuestion = (state: RootState) => state.question.question;

export default questionSlice.reducer;