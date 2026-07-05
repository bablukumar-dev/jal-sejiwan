'use client';

import { useState, useEffect, useContext } from 'react';
import { Check, Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { AppContext } from '@/app/context/AppContext';

export default function SyncStatusIndicator() {
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
  const unsyncedCount = context ? context.unsyncedCount : 0;

  // Offline State
  if (!isOnline) {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 transition-all cursor-help"
        title="Offline Mode: Changes saved locally"
      >
        <CloudOff className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-tight">Offline</span>
        {(unsyncedCount > 0 || syncStatus === 'pending') && (
          <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        )}
      </div>
    );
  }

  // Syncing State
  if (syncStatus === 'syncing') {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 transition-all"
        title="Syncing with cloud..."
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-tight">Syncing</span>
      </div>
    );
  }

  // Error State
  if (syncStatus === 'error') {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 transition-all cursor-pointer hover:bg-red-100"
        onClick={() => context?.triggerSync()}
        title="Sync Error: Click to retry"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-tight">Error</span>
      </div>
    );
  }

  // Pending State (Online but has unsynced local data)
  if (unsyncedCount > 0 || syncStatus === 'pending') {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 transition-all cursor-pointer hover:bg-amber-100"
        onClick={() => context?.triggerSync()}
        title={`${unsyncedCount} items waiting to sync. Click to force sync.`}
      >
        <Cloud className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-tight">
          {unsyncedCount > 0 ? `${unsyncedCount} Pending` : 'Pending'}
        </span>
      </div>
    );
  }

  // Fully Synced State
  return (
    <div 
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50/50 text-emerald-600 border border-emerald-100/50 transition-all"
      title="All data securely synced to cloud"
    >
      <Check className="w-3.5 h-3.5" />
      <span className="text-[10px] font-bold uppercase tracking-tight">Synced</span>
    </div>
  );
}
