/**
 * Client-Side Local Persistence and Sync Queue
 */

const STORAGE_KEYS = {
  COMPLETED_VISITS: 'swasthya_completed_visits',
  SYNC_QUEUE: 'swasthya_sync_queue',
  OFFLINE_MODE: 'swasthya_offline_mode',
  LANGUAGE: 'swasthya_language'
};

export interface LocalCompletedVisit {
  member_id: string;
  due_item: string;
  completed_date: string;
  asha_id: string;
  notes?: string;
  synced: boolean;
}

export function getCompletedVisitsLocal(): LocalCompletedVisit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPLETED_VISITS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markVisitCompletedLocal(
  memberId: string,
  dueItem: string,
  ashaId: string = "ASHA-01",
  notes: string = ""
): LocalCompletedVisit {
  const existing = getCompletedVisitsLocal();
  const today = new Date().toISOString().split('T')[0];

  const record: LocalCompletedVisit = {
    member_id: memberId,
    due_item: dueItem,
    completed_date: today,
    asha_id: ashaId,
    notes,
    synced: false
  };

  // Add or update
  const updated = existing.filter(v => !(v.member_id === memberId && v.due_item === dueItem));
  updated.push(record);

  localStorage.setItem(STORAGE_KEYS.COMPLETED_VISITS, JSON.stringify(updated));

  // Add to sync queue
  const queue = getSyncQueueLocal();
  queue.push({
    action: 'VISIT_COMPLETED',
    timestamp: new Date().toISOString(),
    payload: record
  });
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));

  return record;
}

export function unmarkVisitCompletedLocal(memberId: string, dueItem: string): void {
  const existing = getCompletedVisitsLocal();
  const updated = existing.filter(v => !(v.member_id === memberId && v.due_item === dueItem));
  localStorage.setItem(STORAGE_KEYS.COMPLETED_VISITS, JSON.stringify(updated));
}

export function getSyncQueueLocal(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function flushSyncQueueLocal(): number {
  const queue = getSyncQueueLocal();
  const count = queue.length;
  // Mark completed visits as synced
  const completed = getCompletedVisitsLocal().map(v => ({ ...v, synced: true }));
  localStorage.setItem(STORAGE_KEYS.COMPLETED_VISITS, JSON.stringify(completed));
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
  return count;
}

export function getOfflineModeLocal(): boolean {
  return localStorage.getItem(STORAGE_KEYS.OFFLINE_MODE) === 'true';
}

export function setOfflineModeLocal(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, enabled ? 'true' : 'false');
}
