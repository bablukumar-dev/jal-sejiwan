'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function OnlineStatusBadge() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Read initial status asynchronously to prevent synchronous cascading renders from within the effect
    const timer = setTimeout(() => {
      setIsOnline(navigator.onLine);
    }, 0);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, []);

  if (isOnline) {
    return (
      <div 
        id="online-status-badge" 
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-all shadow-sm"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Wifi className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Online</span>
      </div>
    );
  }

  return (
    <div 
      id="offline-status-badge" 
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 transition-all shadow-sm animate-pulse"
    >
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline</span>
    </div>
  );
}
