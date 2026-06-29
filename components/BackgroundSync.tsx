'use client';

import { useEffect, useRef } from 'react';
import { syncOfflineDeliveries } from '@/lib/syncService';
import { deleteSyncedDeliveries } from '@/lib/idb';
import { useAppContext } from '@/app/context/AppContext';

export default function BackgroundSync() {
  const { setBackgroundSyncing, setSyncProgress } = useAppContext();
  const isSyncing = useRef(false);

  useEffect(() => {
    const runSync = async () => {
      if (isSyncing.current) return;
      
      try {
        const businessId = localStorage.getItem('businessId');
        if (!businessId) return;

        if (typeof navigator !== 'undefined' && navigator.onLine) {
          isSyncing.current = true;
          setBackgroundSyncing(true);
          setSyncProgress(0);
          
          try {
            await syncOfflineDeliveries(businessId, (current, total) => {
              const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
              setSyncProgress(percentage);
            });
            await deleteSyncedDeliveries(); // Cleanup
          } catch (syncError) {
            console.error("Sync process error:", syncError);
          } finally {
            isSyncing.current = false;
            // Small delay before hiding progress indicator for better UX
            setTimeout(() => {
              setBackgroundSyncing(false);
              setSyncProgress(0);
            }, 2000);
          }
        }
      } catch (error) {
        console.error("BackgroundSync runSync error:", error);
        isSyncing.current = false;
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
  }, [setBackgroundSyncing, setSyncProgress]);

  return null; // This component doesn't render anything
}
