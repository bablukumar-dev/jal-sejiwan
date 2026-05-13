'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
}

export default function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_PULL = 100;
  const THRESHOLD = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    
    const y = e.touches[0].clientY;
    const distance = Math.max(0, y - startY);
    
    if (distance > 0 && window.scrollY === 0) {
      // e.preventDefault(); // Might be needed, but React's passive event listeners complain
      setPullDistance(Math.min(distance * 0.5, MAX_PULL));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance > THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD); // Hold it at threshold while refreshing
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: pullDistance - 40 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-white rounded-full p-2 shadow-md border border-slate-100 flex items-center justify-center">
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : (pullDistance / MAX_PULL) * 360 }}
                transition={{ 
                  duration: isRefreshing ? 1 : 0, 
                  repeat: isRefreshing ? Infinity : 0, 
                  ease: "linear" 
                }}
              >
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        animate={{ y: isRefreshing ? THRESHOLD : (isPulling ? pullDistance : 0) }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
