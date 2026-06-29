import client from './client';

export interface SyncResult {
  invoicesSynced: number;
  salesOrdersSynced: number;
  paymentsSynced: number;
  syncedAt: string;
  message: string;
}

/** POST /api/sync — returns 202 immediately, sync runs in background */
export const triggerSync = async (): Promise<void> => {
  await client.post('/sync');
};

/** Opens an SSE connection to /api/sync/events and calls the given callbacks */
export function openSyncEventSource(
  onComplete: (result: SyncResult) => void,
  onError: (result: SyncResult) => void,
): EventSource {
  const base = client.defaults.baseURL ?? '';
  const es = new EventSource(`${base}/sync/events`, { withCredentials: false });

  es.addEventListener('sync-complete', (e: MessageEvent) => {
    try { onComplete(JSON.parse(e.data)); } catch { /* ignore */ }
  });

  es.addEventListener('sync-error', (e: MessageEvent) => {
    try { onError(JSON.parse(e.data)); } catch { /* ignore */ }
  });

  return es;
}
