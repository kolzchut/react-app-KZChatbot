import { v4 as uuidv4 } from 'uuid';
import type { AppDispatch } from '@/store';
import { hydrateFromStorage } from '@/store/slices/conversationSlice';
import { setLoading } from '@/store/slices/chatSlice';
import { loadConversationSnapshot } from './conversationSnapshot';
import appConfig from '@/config/config.json';

const conversationStateKey = appConfig.storageKeys.conversationState;

const createCrossTabSyncService = () => {
  const tabId = uuidv4();
  let reduxDispatch: AppDispatch | null = null;
  let broadcastChannel: BroadcastChannel | null = null;
  let boundStorageHandler: ((event: StorageEvent) => void) | null = null;

  const handleRemoteUpdate = (): void => {
    if (!reduxDispatch) return;

    const snapshot = loadConversationSnapshot();
    if (!snapshot) return;

    if (snapshot.lastUpdatedBy === tabId) return;

    reduxDispatch(hydrateFromStorage(snapshot.conversationState));
    reduxDispatch(setLoading(snapshot.isLoading));
  };

  const initializeService = (dispatch: AppDispatch): void => {
    reduxDispatch = dispatch;

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
  };

  return {
    getTabId: (): string => tabId,
    initializeService,
    destroyService,
  };
};

export const crossTabSyncService = createCrossTabSyncService();
