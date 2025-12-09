import { useTranslationContext } from '@/contexts/TranslationContext';
import { ChatbotStrings } from '@/i18n/types';

/**
 * Custom hook for accessing translatable strings
 *
 * @returns {Object} Object containing:
 *   - strings: All strings as an object
 *   - getString: Function to get a single string by key
 *   - t: Alias for getString (shorthand)
 *
 * @example
 * const { t } = useTranslation();
 * return <button>{t('send_button')}</button>;
 */
export const useTranslation = () => {
  const { strings, getString } = useTranslationContext();

  return {
    strings,
    getString,
    t: getString, // Shorthand alias for convenience
  };
};
