'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-sm w-full rounded-3xl p-8 border border-red-100 shadow-xl text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong!</h2>
        <p className="text-slate-500 text-sm mb-8">An unexpected error occurred. We have logged this issue.</p>
        
        <div className="flex flex-col gap-3">
            <button
            onClick={() => reset()}
            className="w-full py-3 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
            <RefreshCw className="w-4 h-4" /> Try again
            </button>
            <Link
                href="/login"
                className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
                <Home className="w-4 h-4" /> Go to Login
            </Link>
        </div>
      </div>
    </div>
  );
}
