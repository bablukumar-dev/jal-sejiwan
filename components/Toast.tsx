'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

export type ToastProps = {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
};

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-24 left-4 right-4 p-4 rounded-xl shadow-lg flex items-center gap-3 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white z-[200]`}
      >
        {type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
        <p className="text-sm font-bold">{message}</p>
      </motion.div>
    </AnimatePresence>
  );
}
