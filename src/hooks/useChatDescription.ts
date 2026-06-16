import { useAppSelector } from '@/store/hooks';
import { selectActiveConversation } from '@/store/slices/conversationSlice';
import { useTranslation } from '@/hooks/useTranslation';
import { MessageType } from '@/types';

/**
 * Shared state for the on-page chat entry points (ChatButton, ChatArea).
 *
 *  - `chatDescription` — the localized call-to-action label shown next to the
 *    stars icon.
 *  - `hasConversation` — whether the active conversation already has a user
 *    turn, i.e. there is an ongoing thread the user can return to / continue.
 *    Drives the "return to conversation" / "new conversation" actions and the
 *    continue-conversation hint.
 */
export const useChatDescription = () => {
  const { t } = useTranslation();
  const activeConversation = useAppSelector(selectActiveConversation);

  const hasConversation = Boolean(
    activeConversation?.messages.some((message) => message.type === MessageType.User),
  );

  return {
    hasConversation,
    chatDescription: t('chat_description'),
  };
};
