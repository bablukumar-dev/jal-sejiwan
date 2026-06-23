'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-2" id="not_found_title">404 - Page Not Found</h2>
      <p className="text-slate-500 mb-6 text-sm">The page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl active:scale-[0.98] transition-transform text-sm" id="not_found_btn">
        Go Back Home
      </Link>
    </div>
  );
}
