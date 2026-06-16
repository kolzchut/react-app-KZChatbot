import { createContext } from 'react';
import { ChatbotStrings } from '@/i18n/types';

export interface TranslationContextType {
  strings: ChatbotStrings;
  getString: (key: keyof ChatbotStrings) => string;
}

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);
