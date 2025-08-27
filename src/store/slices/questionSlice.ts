import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface QuestionState {
  question: string;
  source?: string;
}

const initialState: QuestionState = {
  question: '',
  source: undefined,
};

const questionSlice = createSlice({
  name: 'question',
  initialState,
  reducers: {
    setQuestion: (state, action: PayloadAction<{text: string, source?: string}>) => {
      state.question = action.payload.text;
      state.source = action.payload.source;
    },
    resetQuestion: (state) => {
      state.question = '';
      state.source = undefined;
    },
  },
});

export const { setQuestion, resetQuestion } = questionSlice.actions;

export const selectQuestion = (state: RootState) => state.question.question;
export const selectQuestionSource = (state: RootState) => state.question.source;

export default questionSlice.reducer;
