import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p>For product inquiries, demo requests, or business partnerships:</p>
        <div className="space-y-2">
          <p>Email: <a href="mailto:jalsejiwan@gmail.com" className="text-blue-600">jalsejiwan@gmail.com</a></p>
          <p>Phone: 7542018086</p>
          <p>Website: <a href="https://jalsejiwan.in" target="_blank" rel="noopener noreferrer" className="text-blue-600">https://jalsejiwan.in</a></p>
        </div>
        <p>We typically respond within 24–48 hours.</p>
        <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}
