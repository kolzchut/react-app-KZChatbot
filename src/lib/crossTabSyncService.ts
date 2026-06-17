import { v4 as uuidv4 } from 'uuid';
import type { AppDispatch } from '@/store';
import { hydrateFromStorage } from '@/store/slices/conversationSlice';
import { setLoading } from '@/store/slices/chatSlice';
import { ConversationSnapshot, loadConversationSnapshot } from './sessionStorage';
import appConfig from '@/config/config.json';

const conversationStateKey = appConfig.storageKeys.conversationState;

class CrossTabSyncService {
  private dispatch: AppDispatch | null = null;
  private tabId: string;
  private channel: BroadcastChannel | null = null;
  private _boundHandleStorage: ((event: StorageEvent) => void) | null = null;

  constructor() {
    this.tabId = uuidv4();
  }

  /** Initialise the service — call once after the Redux store is created. */
  init(dispatch: AppDispatch): void {
    this.dispatch = dispatch;

    // BroadcastChannel — instant cross-tab messaging (no disk I/O)
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(conversationStateKey);
      this.channel.onmessage = () => {
        // A remote tab signalled — read the latest snapshot from localStorage
        this.handleRemoteUpdate();
      };
    }

    // Storage event — fires in all OTHER tabs when localStorage changes
    this._boundHandleStorage = (event: StorageEvent): void => {
      if (event.key !== conversationStateKey) return;
      if (!event.newValue || event.oldValue === event.newValue) {
        // No real change — skip to avoid infinite dispatch loop
        return;
      }
      this.handleRemoteUpdate();
    };
    window.addEventListener('storage', this._boundHandleStorage);
  }

  /** Read the snapshot from localStorage and push it into Redux. */
  private handleRemoteUpdate(): void {
    if (!this.dispatch) return;

    const snapshot = loadConversationSnapshot();
    if (!snapshot) return;

    // Ignore our own writes
    if (snapshot.lastUpdatedBy === this.tabId) return;

    this.dispatch(hydrateFromStorage(snapshot.conversationState));
    this.dispatch(setLoading(snapshot.isLoading));
  }

  /** Returns this tab's unique id so writers can tag their snapshots. */
  getTabId(): string {
    return this.tabId;
  }

  /** Tear down listeners. */
  destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this._boundHandleStorage) {
      window.removeEventListener('storage', this._boundHandleStorage);
      this._boundHandleStorage = null;
    }
    this.dispatch = null;
  }
}

/** Singleton instance — import and call .init(store.dispatch) in main.tsx. */
export const crossTabSyncService = new CrossTabSyncService();
