import { ReactNode } from 'react';
import { ChatbotStrings } from '@/i18n/types';
import { getStrings } from '@/i18n';
import { TranslationContext } from './translationContextBase';

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
