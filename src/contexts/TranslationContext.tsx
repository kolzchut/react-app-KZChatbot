import { createContext, useContext, ReactNode } from 'react';
import { ChatbotStrings } from '@/i18n/types';
import { getStrings } from '@/i18n';

interface TranslationContextType {
  strings: ChatbotStrings;
  getString: (key: keyof ChatbotStrings) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const strings = getStrings();

  const getString = (key: keyof ChatbotStrings): string => {
    return strings[key] || '';
  };

  return (
    <TranslationContext.Provider value={{ strings, getString }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext must be used within TranslationProvider');
  }
  return context;
};
