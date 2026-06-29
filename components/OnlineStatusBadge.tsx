'use client';

import { useState, useEffect, useContext } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { AppContext } from '@/app/context/AppContext';

export default function OnlineStatusBadge() {
  const [isMounted, setIsMounted] = useState(false);
  const context = useContext(AppContext);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return null;

  const isOnline = context ? context.isOnline : true;
  const syncStatus = context ? context.syncStatus : 'synced';

  if (!isOnline) {
    return (
      <div 
        id="offline-status-badge" 
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 transition-all shadow-sm animate-pulse cursor-help"
        title="App is running offline. Your changes are saved locally and will sync once connection is restored."
      >
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        <span>Offline {syncStatus === 'pending' && '(Unsynced Changes)'}</span>
      </div>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <div 
        id="syncing-status-badge" 
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 transition-all shadow-sm"
        title="Synchronizing local records with JalSejiwan cloud..."
      >
        <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin text-blue-500" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <div 
        id="sync-error-status-badge" 
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 transition-all shadow-sm cursor-pointer hover:bg-amber-100"
        onClick={() => context?.triggerSync()}
        title="Sync failed. Click to manually force synchronize with cloud database."
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500 animate-bounce" />
        <span>Sync Error (Retry)</span>
      </div>
    );
  }

  return (
    <div 
      id="online-status-badge" 
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-all shadow-sm"
      title="Connected to JalSejiwan secure cloud servers."
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Wifi className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
      <span className="hidden sm:inline">Online</span>
    </div>
  );
}
