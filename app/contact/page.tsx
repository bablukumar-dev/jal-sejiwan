'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, MessageSquare, ShieldCheck } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-10">
        
        {/* Header Block */}
        <div className="border-b border-slate-100 pb-8 space-y-4">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition">
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Contact JalSejiwan
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            We are here to help water suppliers across India digitize and simplify their operations.
          </p>
        </div>

        {/* Short description about support */}
        <div className="space-y-4">
          <p className="leading-relaxed text-slate-700">
            At JalSejiwan, customer satisfaction is our top priority. If you have any questions about our 
            <strong>Water Delivery Management Software India</strong>, require custom onboarding for your 20L water jar delivery business, or want a live interactive demo for your staff, our Indian support team is ready to assist you.
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Direct Touchpoints</h2>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Email Support</h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  <a href="mailto:support@jalsejiwan.in" className="text-blue-600 hover:underline">support@jalsejiwan.in</a>
                </p>
                <p className="text-xs text-slate-400 mt-1">We respond within 12–24 hours on working days.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Business Enquiries</h3>
                <p className="text-sm text-slate-600 mt-0.5 font-medium">
                  +91-9876543210
                </p>
                <p className="text-xs text-slate-400 mt-1">Available for partnerships and bulk enterprise setups.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Registered Office</h3>
                <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                  JalSejiwan Tech Solutions Private Limited,<br />
                  DLF Cyber City, Sector 24,<br />
                  Gurugram, Haryana - 122002, India
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Support Hours</h3>
                <p className="text-sm text-slate-600 mt-0.5 font-medium">
                  Monday – Saturday
                </p>
                <p className="text-xs text-slate-500">9:00 AM – 6:00 PM (IST)</p>
              </div>
            </div>

          </div>

          {/* Quick Contact Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Send an Online Inquiry</h2>
            <p className="text-xs text-slate-500">
              Fill in your details and our team will call or email you shortly.
            </p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rajesh Kumar" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile / WhatsApp Number</label>
                <input 
                  type="tel" 
                  placeholder="e.g. +91 98765 43210" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Water Agency Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ganga Aqua Solutions" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Message / Requirements</label>
                <textarea 
                  rows={3}
                  placeholder="Tell us about your 20 litre water jar business size..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-sm hover:bg-blue-700 transition text-sm text-center"
                onClick={() => console.log("Inquiry submitted")}
              >
                Submit Request
              </button>
            </form>
          </div>

        </div>

        {/* Quality assurance banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-center text-sm text-emerald-800">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Secure Verification:</strong> We protect your business information. Any data shared in this inquiry is safe under our strict NDA protocols.
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-6 border-t border-slate-100">
          <Link href="/" className="text-blue-600 font-semibold hover:underline">
            &larr; Back to Home Page
          </Link>
          <p className="text-xs text-slate-400">
            © 2026 JalSejiwan. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}
