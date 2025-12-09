import { ChatbotStrings } from './i18n/types';

declare global {
  interface Window {
    KZChatbotConfig: {
      uuid: string;
      chatbotIsShown: boolean;
      cookieExpiry: string;
      feedbackCharacterLimit: number;
      questionCharacterLimit: number;
      questionsPermitted: number;
      termsofServiceUrl: string;
      usageHelpUrl: string;
      referrer: string;
      slugs: Partial<ChatbotStrings>;
      restPath: string;
      autoOpen: boolean;
    };
  }
}

export {};
