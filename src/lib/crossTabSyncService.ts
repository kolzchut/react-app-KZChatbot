import { v4 as uuidv4 } from 'uuid';
import type { AppDispatch, RootState } from '@/store';
import { hydrateFromStorage } from '@/store/slices/conversationSlice';
import { ConversationState } from '@/store/slices/conversationTypes';
import { setLoading } from '@/store/slices/chatSlice';
import { loadConversationSnapshot } from './conversationSnapshot';
import appConfig from '@/config/config.json';

const conversationStateKey = appConfig.storageKeys.conversationState;

const createCrossTabSyncService = () => {
  const tabId = uuidv4();
  let reduxDispatch: AppDispatch | null = null;
  let reduxGetState: (() => RootState) | null = null;
  let broadcastChannel: BroadcastChannel | null = null;
  let boundStorageHandler: ((event: StorageEvent) => void) | null = null;

  /** Deep-compare two conversation states to avoid unnecessary re-renders. */
  const hasMessagesChanged = (current: ConversationState, incoming: ConversationState): boolean => {
    const convsA = current.conversations ?? [];
    const convsB = incoming.conversations ?? [];
    if (convsA.length !== convsB.length) return true;
    return convsA.some((conv, i) => {
      const convB = convsB[i];
      if (!convB) return true;
      if (conv.threadId !== convB.threadId) return true;
      if (conv.quotaReached !== convB.quotaReached) return true;
      if (conv.messages.length !== convB.messages.length) return true;
      return conv.messages.some((msg, j) => {
        const msgB = convB.messages[j];
        if (!msgB) return true;
        return msg.liked !== msgB.liked
          || msg.feedbackSubmitted !== msgB.feedbackSubmitted
          || msg.threadId !== msgB.threadId
          || msg.content !== msgB.content;
      });
    });
  };

  const handleRemoteUpdate = (): void => {
    if (!reduxDispatch || !reduxGetState) return;

    const snapshot = loadConversationSnapshot();
    if (!snapshot) return;

    if (snapshot.lastUpdatedBy === tabId) return;

    const currentState = reduxGetState();
    const incomingState = snapshot.conversationState;

    // Only hydrate if something actually changed
    if (!hasMessagesChanged(currentState.conversation, incomingState)) return;

    reduxDispatch(hydrateFromStorage(incomingState));
    reduxDispatch(setLoading(snapshot.isLoading));
  };

  const initializeService = (dispatch: AppDispatch, getState: () => RootState): void => {
    reduxDispatch = dispatch;
    reduxGetState = getState;

    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel(conversationStateKey);
      broadcastChannel.onmessage = () => {
        handleRemoteUpdate();
      };
    }

    boundStorageHandler = (event: StorageEvent): void => {
      if (event.key !== conversationStateKey) return;
      if (!event.newValue || event.oldValue === event.newValue) {
        return;
      }
      handleRemoteUpdate();
    };
    window.addEventListener('storage', boundStorageHandler);
  };

  const destroyService = (): void => {
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
    if (boundStorageHandler) {
      window.removeEventListener('storage', boundStorageHandler);
      boundStorageHandler = null;
    }
    reduxDispatch = null;
    reduxGetState = null;
  };

  return {
    getTabId: (): string => tabId,
    initializeService,
    destroyService,
  };
};

export const crossTabSyncService = createCrossTabSyncService();
