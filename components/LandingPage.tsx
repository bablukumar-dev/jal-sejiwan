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
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Digitize your 20 litre water jar delivery business with real-time billing, inventory tracking, and WhatsApp automation. Our comprehensive Water Supply Business Management App is designed specifically for drinking water supply startups, helping you track active delivery routes, collect pending payments on time, and build customer trust through digital invoicing.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login" className="font-bold bg-blue-600 text-white px-6 py-3 rounded-xl shadow-sm hover:bg-blue-700">Start Free Trial</Link>
            <Link href="/login" className="font-bold bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl shadow-sm hover:bg-slate-50">Login</Link>
          </div>
        </section>

        {/* Section 2: Problem */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Why Water Suppliers Need Digital Management</h2>
          <p className="text-slate-600 leading-relaxed">
            Running a daily water distribution business is highly demanding. In India, many businesses rely on paper card systems or manual register books to note down jar distribution. This often leads to severe business leaks:
          </p>
          <ul className="grid md:grid-cols-2 gap-4 text-sm text-slate-600 list-disc pl-5">
            <li><strong>Empty Jar Loss:</strong> Suppliers lose hundreds of 20-litre cans annually because customers fail to return them and staff forget who has how many empty jars.</li>
            <li><strong>Pending Payment Tracking:</strong> Collecting accurate payments becomes a nightmare. Customers claim they didn&apos;t receive water on certain days, resulting in dispute and cash flow issues.</li>
            <li><strong>Staff Mismanagement:</strong> Lack of real-time visibility on delivery boys and distribution routes leads to skipped deliveries and delayed jar drop-offs.</li>
            <li><strong>Inefficient Billing Cycles:</strong> Generating individual monthly billing sheets manually is tedious and prone to mathematical errors.</li>
          </ul>
          <p className="text-slate-600 leading-relaxed">
            JalSejiwan offers a state-of-the-art <strong>Water Distribution Management System</strong> that completely digitizes daily entries, simplifies empty jar tallies, and registers cash flow transparently. It provides a robust, fail-safe <strong>Digital Solution for Water Suppliers</strong> of modern India.
          </p>
        </section>

        {/* Section 3: Features */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center text-slate-900">Complete Water Delivery Management System</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: Truck, 
                title: 'Delivery Tracking', 
                desc: 'Optimize active daily supply. Deliverers can mark deliveries as completed right from the field. Prevent route overlapping and streamline scheduling for your 20 Litre Water Jar Delivery System.' 
              },
              { 
                icon: Package, 
                title: 'Inventory Management', 
                desc: 'Keep precise tallies of filled jars and empty cans. Maintain real-time stock registers. Tracks empty jars deposited with each customer so you never experience jar losses again.' 
              },
              { 
                icon: FileText, 
                title: 'Automatic Billing', 
                desc: 'A seamless Water Can Billing Software built to auto-calculate daily, weekly, or monthly balances, advance deposit entries, and total pending amounts with absolute accuracy.' 
              },
              { 
                icon: Bell, 
                title: 'WhatsApp Reminders', 
                desc: 'Automate collection updates. Draft and prompt customers about their monthly dues directly via customizable WhatsApp alerts and payment links to boost recovery times.' 
              },
              { 
                icon: Droplet, 
                title: 'PDF Invoices', 
                desc: 'Generate professional, clean HD PDF invoices instantly for daily transactions or monthly summaries and share them with household and corporate clients with one tap.' 
              },
              { 
                icon: Users, 
                title: 'Role-Based Access', 
                desc: 'Secure multi-tenant control hierarchy. The owner oversees finances, managers handle operational logistics, and delivery staff interact with straightforward mobile delivery routes.' 
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <feature.icon className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Role System */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-slate-900">Cohesive Role-Based Operational App</h2>
          <p className="text-center text-slate-600 max-w-2xl mx-auto text-sm">
            JalSejiwan behaves like a tailored <strong>Water Delivery ERP India</strong>, synchronizing your operations from the admin panel down to mobile-wielding delivery staff.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                t: 'Owner (Business Owner)',
                sub: 'Full Financial Governance & Audits',
                d: 'As the principal owner, you enjoy total operational oversight. View real-time revenue tallies, monitor outstanding receivables, manage pricing tier presets, inspect master analytics, and evaluate active workspaces.'
              },
              {
                t: 'Manager (Supervisor)',
                sub: 'Route Planning & Inventory Supervision',
                d: 'Managers assist in assigning daily supply patterns, registering new residential customers, keeping track of warehouse inventory stock, auditing payment logs, and updating client information securely.'
              },
              {
                t: 'Staff (Delivery Partner)',
                sub: 'Actionable Field Delivery interface',
                d: 'Designed specifically for the delivery boys. A high-contrast, fast-loading dashboard to complete daily route goals, mark deliveries in 1-tap, note returned jars, and record cash/UPI collections.'
              }
            ].map((role, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="font-bold text-lg text-blue-700 mb-1">{role.t}</div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{role.sub}</div>
                  <p className="text-sm text-slate-600 leading-relaxed">{role.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: How JalSejiwan Works */}
        <section className="bg-slate-50 p-8 rounded-2xl border border-dashed border-slate-300 space-y-6">
          <h2 className="text-2xl font-bold text-center text-slate-900">How JalSejiwan Works</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { step: '01', title: 'Add Customers', desc: 'Register clients, schedule frequency, and set base prices.' },
              { step: '02', title: 'Assign Delivery', desc: 'Deploy staff partners and assign customized routes.' },
              { step: '03', title: 'Track Inventory', desc: 'Monitor filled stock vs empty cans in absolute real-time.' },
              { step: '04', title: 'Collect Payments', desc: 'Collect on spot via UPI/Cash or send automated payment reminders.' },
              { step: '05', title: 'Monitor Reports', desc: 'Receive instant audit trail summaries and ledger analysis.' }
            ].map((s, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-2 relative">
                <span className="text-3xl font-extrabold text-blue-100 absolute top-4 right-4">{s.step}</span>
                <h3 className="font-bold text-slate-800 text-sm pt-4 z-10">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed z-10">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Screen Preview */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
          <h2 className="text-2xl font-bold mb-6 text-slate-900">See JalSejiwan in Action</h2>
          <div className="bg-slate-100 rounded-xl h-63 flex items-center justify-center text-slate-400 border border-slate-200 font-medium text-sm">
            [Dashboard Preview Placeholder]
          </div>
        </section>

        {/* Section 6: CTA */}
        <section className="bg-blue-700 text-white rounded-2xl p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold">Start Digitizing Your Water Delivery Business Today</h2>
          <p className="text-blue-100 max-w-xl mx-auto text-sm leading-relaxed">
            Say goodbye to missing records, register disputes, and unpaid water jar dues. Embrace India&apos;s leading 20 litre water jar business app and get complete visibility over your fleet.
          </p>
          <Link href="/login" className="inline-block font-bold bg-white text-blue-700 px-8 py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-md">Get Started Now</Link>
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
