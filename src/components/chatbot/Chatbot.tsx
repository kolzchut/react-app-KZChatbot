import { useEffect, useMemo, useRef, useState } from 'react';
import { Errors, Message, MessageType } from '@/types';
import { pushAnalyticsEvent } from '@/lib/analytics';
import { useMobile } from '@/lib/useMobile';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeChat, openChat, selectIsChatOpen } from '@/store/slices/chatSlice';
import { resetQuestion, selectQuestion, selectQuestionSource } from '@/store/slices/questionSlice';
import { replaceActiveMessages, selectActiveConversation, selectArchivedConversations, selectConversationState } from '@/store/slices/conversationSlice';
import { ClosePopover, Footer, Messages, Popover, PopoverContent } from '@/components';
import DeleteHistoryModal from './DeleteHistoryModal';
import { useConversationSession } from './hooks/useConversationSession';
import { useConversationSubmit } from './hooks/useConversationSubmit';
import WebiksFooter from './webiksFooter/WebiksFooter';
import './chatbot.css';

const Chatbot = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isMobile = useMobile();
  const isChatOpen = useAppSelector(selectIsChatOpen);
  const question = useAppSelector(selectQuestion);
  const questionSource = useAppSelector(selectQuestionSource) || 'popup';
  const conversationState = useAppSelector(selectConversationState);
  const activeConversation = useAppSelector(selectActiveConversation);
  const archivedConversations = useAppSelector(selectArchivedConversations);
  const [globalConfigObject, setGlobalConfigObject] = useState<typeof window.KZChatbotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const separatorRef = useRef<HTMLDivElement>(null);
  const initialErrors = useMemo<Errors>(() => ({ description: '' }), []);
  const [errors, setErrors] = useState<Errors>(initialErrors);
  const activeMessages = useMemo(() => activeConversation?.messages || [], [activeConversation?.messages]);
  const isQuotaReached = Boolean(activeConversation?.quotaReached);
  const hasAskedQuestion = activeMessages.some((item) => item.type === MessageType.User);

  const setMessages: React.Dispatch<React.SetStateAction<Message[]>> = (updater) => {
    const next = typeof updater === 'function' ? updater(activeMessages) : updater;
    dispatch(replaceActiveMessages(next));
  };

  const handleCloseChat = () => {
    if (!hasAskedQuestion) pushAnalyticsEvent('closed_unused');
    dispatch(closeChat());
  };

  const { handleStartNewConversation, handleClearAllHistory } = useConversationSession({ config: globalConfigObject, state: conversationState, activeConversation, t, dispatch });
  useConversationSubmit({ config: globalConfigObject, question, source: questionSource, conversationState, activeQuestionCount: activeConversation?.questionCount || 0, quotaReached: isQuotaReached, dispatch, resetQuestion: () => dispatch(resetQuestion()), onLoading: setIsLoading, t });

  useEffect(() => setGlobalConfigObject(window.KZChatbotConfig || null), []);
  useEffect(() => {
    if (!globalConfigObject?.autoOpen) return;
    pushAnalyticsEvent('opened', 'auto-opened');
    dispatch(openChat());
  }, [dispatch, globalConfigObject]);

  useEffect(() => {
    document.body.style.overflow = isChatOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isChatOpen]);

  useEffect(() => {
    if (!messageContainerRef.current) return;
    messageContainerRef.current.scrollTo({ top: messageContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeMessages, isLoading]);

  useEffect(() => {
    if (archivedConversations.length === 0 || !separatorRef.current) return;
    separatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [archivedConversations.length]);

  return (
    <Popover isChatOpen={isChatOpen}><div className="chatbot-overlay" /><PopoverContent className={`chatbot-popover-content ${isMobile ? 'mobile' : 'desktop'}`}><DeleteHistoryModal isOpen={showDeleteModal} onCancel={() => setShowDeleteModal(false)} onConfirm={() => { setShowDeleteModal(false); handleClearAllHistory(); }} /><ClosePopover handleChatSetIsOpen={handleCloseChat} onStartNewConversation={() => handleStartNewConversation('header-button')} disableNewConversation={!hasAskedQuestion} /><div className="chatbot-popover-main"><Messages messages={activeMessages} activeMessages={activeMessages} archivedConversations={archivedConversations} onStartNewConversation={() => handleStartNewConversation('inline-limit-cta')} setMessages={setMessages} isLoading={isLoading} ref={messageContainerRef} separatorRef={separatorRef} globalConfigObject={globalConfigObject} errors={errors} setErrors={setErrors} initialErrors={initialErrors} /><Footer showInput={true} messages={activeMessages} isLoading={isLoading} globalConfigObject={globalConfigObject} errors={errors} setErrors={setErrors} isChatOpen={isChatOpen} isQuotaReached={isQuotaReached} onDeleteHistoryClick={() => { pushAnalyticsEvent('history_deleted_requested'); setShowDeleteModal(true); }} /><WebiksFooter /></div></PopoverContent></Popover>
  );
};

export default Chatbot;
