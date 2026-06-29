import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 md:p-12 font-sans">
      <div className="bg-white max-w-4xl w-full p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Header Block */}
        <div className="border-b border-slate-100 pb-8 space-y-4">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Terms & Conditions – JalSejiwan
          </h1>
          <p className="text-slate-500 text-lg">
            Last Updated: June 2026
          </p>
        </div>

        {/* Content Block */}
        <div className="py-8 prose prose-slate max-w-none">
          <p className="text-slate-600 leading-relaxed mb-6">
            Welcome to JalSejiwan. By accessing and using our application, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            By using the JalSejiwan platform, you accept these terms in full. If you disagree with these terms and conditions or any part of these terms and conditions, you must not use our platform.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Service Description</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            JalSejiwan provides water delivery management software designed specifically for 20-liter water jar businesses in India. The service includes inventory tracking, customer management, delivery routing, and billing functionalities.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. User Accounts</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            To use certain features of the service, you must register for an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Data Privacy</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Your use of the platform is also governed by our Privacy Policy. By using the service, you consent to the collection and use of your data as outlined in our Privacy Policy.
          </p>
        </div>

        {/* Agreement Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-3 items-start text-sm text-blue-800 mt-8">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Acceptance of Terms:</strong> By registering or logging in, you acknowledge that you have read, understood, and agreed to these terms, our Privacy Policy, and regional compliance guidelines.
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-6 border-t border-slate-100 mt-8">
          <Link href="/" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Home Page
          </Link>
          <p className="text-xs text-slate-400">
            © 2026 JalSejiwan. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}
