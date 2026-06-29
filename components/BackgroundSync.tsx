'use client';

import { useEffect, useRef } from 'react';
import { syncOfflineDeliveries } from '@/lib/syncService';
import { deleteSyncedDeliveries } from '@/lib/idb';

export default function BackgroundSync() {
  const isSyncing = useRef(false);

  useEffect(() => {
    const runSync = async () => {
      if (isSyncing.current) return;
      
      const businessId = localStorage.getItem('businessId');
      if (!businessId) return;

      if (typeof navigator !== 'undefined' && navigator.onLine) {
        isSyncing.current = true;
        try {
          await syncOfflineDeliveries(businessId);
          await deleteSyncedDeliveries(); // Cleanup
        } catch (error) {
          console.error("BackgroundSync error:", error);
        } finally {
          isSyncing.current = false;
        }
      }
    };

    // Initial sync
    runSync();

    // Listen for online event
    window.addEventListener('online', runSync);

    // Periodic check every 30 seconds
    const interval = setInterval(runSync, 30000);

    return () => {
      window.removeEventListener('online', runSync);
      clearInterval(interval);
    };
  }, []);

  return null; // This component doesn't render anything
}
