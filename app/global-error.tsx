'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-50 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center max-w-sm w-full">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Critical System Error</h2>
          <p className="text-slate-500 text-sm mb-6">A critical error occurred. Please try refreshing the application.</p>
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
          >
            Try Refreshing
          </button>
        </div>
      </body>
    </html>
  );
}
