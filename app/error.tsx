'use client';

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Something went wrong!</h2>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
