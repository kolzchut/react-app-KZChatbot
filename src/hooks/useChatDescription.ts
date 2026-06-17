import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectActiveConversation } from '@/store/slices/conversationSlice';
import { useTranslation } from '@/hooks/useTranslation';

export const useChatDescription = () => {
    const { t } = useTranslation();
    const activeConversation = useAppSelector(selectActiveConversation);
    const hasConversation = Boolean(activeConversation?.messages.some((item) => item.type === 'user'));

    const chatDescription = useMemo(
        () =>
            hasConversation
                ? t('chat_description_when_active_conversation')
                : t('chat_description'),
        [hasConversation, t],
    );

    return {
        hasConversation,
        chatDescription,
    };
};

