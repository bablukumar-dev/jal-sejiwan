'use client';

import React from 'react';
import { useAppContext } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CheckCircle2, RefreshCw } from 'lucide-react';

export default function SyncIndicator() {
  const { isBackgroundSyncing, syncProgress, syncStatus, isOnline } = useAppContext();

  // Only show if background syncing or if there's an error/pending state
  const shouldShow = isBackgroundSyncing || (!isOnline) || (syncStatus === 'syncing') || (syncStatus === 'error');

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
      >
        <div className="bg-white/95 backdrop-blur-md border border-blue-100 shadow-xl rounded-2xl px-5 py-3 flex items-center gap-4 pointer-events-auto">
          {isBackgroundSyncing ? (
            <>
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeDasharray={100}
                    strokeDashoffset={100 - syncProgress}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <RefreshCw className="absolute w-4 h-4 text-blue-500 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-none mb-1">
                  Syncing offline data...
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {syncProgress}% Complete
                </p>
              </div>
            </>
          ) : !isOnline ? (
            <>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-none mb-1">
                  Offline Mode
                </p>
                <p className="text-xs text-amber-600 font-medium">
                  Changes will sync when online
                </p>
              </div>
            </>
          ) : syncStatus === 'syncing' ? (
            <>
              <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
              <p className="text-sm font-medium text-slate-700">Saving changes...</p>
            </>
          ) : syncStatus === 'error' ? (
            <>
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-slate-700">Sync Error. Retrying...</p>
            </>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
