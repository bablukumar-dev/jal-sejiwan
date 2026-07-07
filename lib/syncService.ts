import { getUnsyncedDeliveries, markAsSynced } from './idb';
import { logActivity } from './activityLogger';

export const syncOfflineDeliveries = async (
  businessId: string, 
  onProgress?: (current: number, total: number) => void
) => {
  if (!businessId) return;
  // Auth system removed - sync disabled
  console.log("Auth System Removed: Offline sync disabled.");
};
