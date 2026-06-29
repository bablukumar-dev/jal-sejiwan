import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Eye, FileText, Globe } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 md:p-12 font-sans">
      <div className="bg-white max-w-4xl w-full p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
        
        {/* Header Block */}
        <div className="border-b border-slate-100 pb-8 space-y-4">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy – JalSejiwan
          </h1>
          <p className="text-slate-500 text-lg">
            Last Updated: June 2026
          </p>
        </div>

        {/* Content Block */}
        <div className="py-8 space-y-8">
          <section>
            <p className="text-slate-600 leading-relaxed">
              At JalSejiwan, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our water delivery management platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-blue-600 mb-4"><Lock className="w-6 h-6" /></div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Data Security</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We use administrative, technical, and physical security measures to help protect your personal information. All customer data and delivery logs are encrypted and stored in secure cloud environments.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-blue-600 mb-4"><Eye className="w-6 h-6" /></div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Data Usage</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We use the information we collect to provide and maintain the service, process transactions, send delivery notifications via WhatsApp, and manage your account effectively.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-blue-600 mb-4"><FileText className="w-6 h-6" /></div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Information We Collect</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We collect information that you provide directly to us, such as your name, contact details, business address, and details of your customers for delivery management.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-blue-600 mb-4"><Globe className="w-6 h-6" /></div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Third-Party Services</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We may share information with third-party vendors, service providers, contractors or agents who perform services for us or on our behalf, such as WhatsApp API providers for reminders.
              </p>
            </div>
          </div>

          <section className="pt-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Contact Us</h2>
            <p className="text-slate-600 leading-relaxed">
              If you have questions or comments about this Privacy Policy, please contact us at <a href="mailto:privacy@jalsejiwan.in" className="text-blue-600 hover:underline">privacy@jalsejiwan.in</a>.
            </p>
          </section>
        </div>

        {/* Agreement Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-3 items-start text-sm text-blue-800">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Data Integrity:</strong> JalSejiwan is committed to ensuring that your data is handled with the highest standards of integrity and confidentiality.
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
