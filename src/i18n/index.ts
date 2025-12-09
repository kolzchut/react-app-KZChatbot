import { ChatbotStrings } from './types';
import { hebrewStrings } from './strings.he';
import { englishStrings } from './strings.en';

// Build-time locale selection via Vite environment variable
const LOCALE = import.meta.env.VITE_LOCALE || 'he';

const localeStrings: Record<string, ChatbotStrings> = {
  he: hebrewStrings,
  en: englishStrings,
};

/**
 * Get default strings based on build-time locale
 */
export const getDefaultStrings = (): ChatbotStrings => {
  return localeStrings[LOCALE] || hebrewStrings;
};

/**
 * Merge window.KZChatbotConfig.slugs with default strings
 * External config takes precedence over defaults
 */
export const getStrings = (): ChatbotStrings => {
  const defaultStrings = getDefaultStrings();
  const externalStrings = window.KZChatbotConfig?.slugs || {};

  return {
    ...defaultStrings,
    ...externalStrings,
  };
};

/**
 * Type-safe string getter
 */
export const getString = (key: keyof ChatbotStrings): string => {
  const strings = getStrings();
  return strings[key] || '';
};
