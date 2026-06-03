import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p>This is the privacy policy for JalSejiwan.</p>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Contacting Us</h2>
          <p>For questions regarding privacy:</p>
          <p>Email: <a href="mailto:jalsejiwan@gmail.com" className="text-blue-600">jalsejiwan@gmail.com</a></p>
          <p>Phone: 7542018086</p>
        </div>
        <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}
