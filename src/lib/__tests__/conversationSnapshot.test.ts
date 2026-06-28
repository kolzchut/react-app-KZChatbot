import appConfig from '@/config/config.json';
import { ConversationItem, ConversationState } from '@/store/slices/conversationTypes';
import { loadConversationSnapshot, saveConversationSnapshot } from '../conversationSnapshot';

const conversationStateKey = appConfig.storageKeys.conversationState;

const createConversation = (id: string, archived: boolean): ConversationItem => ({
  id,
  archived,
  quotaReached: false,
  questionCount: 0,
  createdAt: 0,
  updatedAt: 0,
  messages: [],
});

const createState = (conversations: ConversationItem[]): ConversationState => ({
  sessionId: 'session',
  sessionExpiresAt: 0,
  activeConversationId: 'active',
  isViewingArchive: false,
  maxQuestionsPerConversation: 8,
  conversations,
});

const quotaError = (): DOMException => new DOMException('quota', 'QuotaExceededError');

describe('conversationSnapshot', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('loadConversationSnapshot', () => {
    it('returns null and removes the key when stored JSON is corrupt', () => {
      localStorage.setItem(conversationStateKey, '{not valid json');

      expect(loadConversationSnapshot()).toBeNull();
      expect(localStorage.getItem(conversationStateKey)).toBeNull();
    });

    it('returns null when nothing is stored', () => {
      expect(loadConversationSnapshot()).toBeNull();
    });

    it('parses a valid snapshot', () => {
      const state = createState([createConversation('active', false)]);
      saveConversationSnapshot(state, false, 'tab-1');

      const snapshot = loadConversationSnapshot();
      expect(snapshot?.lastUpdatedBy).toBe('tab-1');
      expect(snapshot?.conversationState.conversations).toHaveLength(1);
    });
  });

  describe('saveConversationSnapshot', () => {
    it('prunes the oldest archived conversation and retries on quota errors', () => {
      const state = createState([
        createConversation('archived-old', true),
        createConversation('active', false),
      ]);

      const realSetItem = Storage.prototype.setItem;
      const setItem = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementationOnce(() => {
          throw quotaError();
        })
        .mockImplementation(function (this: Storage, key: string, value: string) {
          realSetItem.call(this, key, value);
        });

      saveConversationSnapshot(state, false, 'tab-1');

      expect(setItem).toHaveBeenCalledTimes(2);
      const snapshot = loadConversationSnapshot();
      expect(snapshot?.conversationState.conversations.map((c) => c.id)).toEqual(['active']);
    });

    it('gives up without throwing when no archived conversations remain', () => {
      const state = createState([createConversation('active', false)]);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError();
      });

      expect(() => saveConversationSnapshot(state, false, 'tab-1')).not.toThrow();
      expect(warn).toHaveBeenCalled();
    });

    it('rethrows non-quota errors', () => {
      const state = createState([createConversation('active', false)]);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('boom');
      });

      expect(() => saveConversationSnapshot(state, false, 'tab-1')).toThrow('boom');
    });
  });
});
