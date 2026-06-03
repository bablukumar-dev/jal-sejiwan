import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h1 className="text-3xl font-bold">Terms & Conditions</h1>
        <p>These are the terms and conditions for using JalSejiwan.</p>
        <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}
