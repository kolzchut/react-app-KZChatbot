import appConfig from '@/config/config.json';

export type CrossTabEventName =
  | 'new-message'
  | 'new-conversation'
  | 'clear-history'
  | 'session-expired';

export interface CrossTabEvent {
  name: CrossTabEventName;
  timestamp: number;
}

const syncKey = appConfig.storageKeys.crossTabSync;
const supportsBroadcast = typeof BroadcastChannel !== 'undefined';

export const createCrossTabSync = (onEvent: (event: CrossTabEvent) => void) => {
  const channel = supportsBroadcast ? new BroadcastChannel(syncKey) : null;
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== syncKey || !event.newValue) return;
    onEvent(JSON.parse(event.newValue) as CrossTabEvent);
  };

  if (channel) {
    channel.onmessage = (event: MessageEvent<CrossTabEvent>) => onEvent(event.data);
  }

  window.addEventListener('storage', handleStorage);

  const publish = (event: CrossTabEvent) => {
    if (channel) channel.postMessage(event);
    localStorage.setItem(syncKey, JSON.stringify(event));
  };

  const dispose = () => {
    window.removeEventListener('storage', handleStorage);
    if (channel) channel.close();
  };

  return { publish, dispose };
};