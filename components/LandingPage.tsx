import Link from 'next/link';
import { Droplet, Truck, Package, Bell, FileText, Users, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-blue-700">JalSejiwan</div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Login</Link>
            <Link href="/login" className="text-sm font-bold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-20">
        {/* Section 1: Hero */}
        <section className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            JalSejiwan – Water Delivery Management Software India
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Digitize your 20 litre water jar delivery business with real-time billing, inventory tracking, and WhatsApp automation.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login" className="font-bold bg-blue-600 text-white px-6 py-3 rounded-xl shadow-sm hover:bg-blue-700">Start Free Trial</Link>
            <Link href="/login" className="font-bold bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl shadow-sm hover:bg-slate-50">Login</Link>
          </div>
        </section>

        {/* Section 2: Problem */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Why Water Suppliers Need Digital Management</h2>
          <p className="text-slate-600">
            Manual registers, payment tracking errors, empty jar mismatches, and staff accountability issues cost water suppliers time and money. JalSejiwan streamlines your operations to eliminate these inefficiencies.
          </p>
        </section>

        {/* Section 3: Features */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center">Complete Water Delivery Management System</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: 'Delivery Tracking', desc: 'For 20 Litre Water Jar Businesses' },
              { icon: Package, title: 'Inventory Management', desc: 'Empty Jar tracking system' },
              { icon: FileText, title: 'Automatic Billing', desc: 'Due Calculation and Billing' },
              { icon: Bell, title: 'WhatsApp Reminders', desc: 'Automatic Payment Reminders' },
              { icon: Droplet, title: 'PDF Invoices', desc: 'HD PDF Invoice Generation' },
              { icon: Users, title: 'Role-Based Access', desc: 'Owner, Manager, Staff roles' },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <feature.icon className="w-8 h-8 text-blue-600" />
                <h3 className="font-bold">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Role System */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center">Built for Every Role</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[{t:'Owner', d:'Full financial control.'}, {t:'Manager', d:'Permission restricted access.'}, {t:'Staff', d:'Field-friendly updates.'}].map((role, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="font-bold text-blue-700 mb-1">{role.t}</div>
                <div className="text-sm text-slate-600">{role.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Screen Preview */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
          <h2 className="text-2xl font-bold mb-6">See JalSejiwan in Action</h2>
          <div className="bg-slate-100 rounded-xl h-64 flex items-center justify-center text-slate-400 border border-slate-200">
            [Dashboard Preview Placeholder]
          </div>
        </section>

        {/* Section 6: CTA */}
        <section className="bg-blue-700 text-white rounded-2xl p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold">Start Digitizing Your Water Delivery Business Today</h2>
          <Link href="/login" className="inline-block font-bold bg-white text-blue-700 px-8 py-3 rounded-xl">Get Started Now</Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 text-center text-slate-500 text-sm">
        <div className="max-w-5xl mx-auto px-4 flex justify-center gap-6">
          <Link href="/about" className="hover:text-slate-900">About</Link>
          <Link href="/contact" className="hover:text-slate-900">Contact</Link>
          <Link href="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-900">Terms & Conditions</Link>
        </div>
      </footer>
    </div>
  );
}
