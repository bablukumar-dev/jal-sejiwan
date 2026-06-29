import Link from 'next/link';
import { ShieldCheck, Truck, Users, Receipt, Calendar, MessageSquare, Database, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-10">
        
        {/* Header Block */}
        <div className="border-b border-slate-100 pb-8 space-y-4">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition">
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            About JalSejiwan – Water Delivery Management Software India
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Empowering India&apos;s packaged drinking water suppliers with smart, scalable, and paperless cloud technology.
          </p>
        </div>

        {/* Introduction Section */}
        <div className="space-y-4">
          <p className="leading-relaxed text-slate-700">
            <strong>JalSejiwan</strong> is India’s premier, custom-built <strong>Water Delivery Management Software India</strong>, engineered specifically to address the unique operational hurdles faced by <strong>20 Litre Water Jar Business App</strong> operators, RO water purification plants, and packaged drinking water distributors across the country. We help water suppliers digitize their entire distribution lifecycle—eliminating the need for manual registers, reducing delivery friction, and accelerating payment collections.
          </p>
          <p className="leading-relaxed text-slate-700">
            Across India, from bustling metropolitan cities to growing semi-urban hubs, thousands of local drinking water suppliers operate the daily lifelines of offices, schools, and residential complexes. Historically, this highly dynamic industry has relied heavily on manual card-punching, physical registers, and paper diaries. This leads to missing delivery records, unaccountable lost water jars, delayed billing cycles, and uncollected revenue. JalSejiwan was created to solve these exact problems.
          </p>
        </div>

        {/* The Problem Section */}
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-bold text-rose-900">The Problem with Manual Water Supplier Operations</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span> Lost 20L water jars due to poor deposit tracking.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span> Inefficient routing leading to high fuel costs.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span> Missing payment entries and uncollected cash.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span> Huge manual effort to generate end-of-month invoices.
            </li>
          </ul>
        </div>

        {/* Why Digital Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Why Transition to a Digital Water Supply System?
          </h2>
          <p className="leading-relaxed text-slate-700">
            Operating with a centralized <strong>Drinking Water Distribution Software</strong> ensures complete visibility over your business. Our cloud database stores all client histories, daily dispatch runs, and jar counts. By moving to JalSejiwan, suppliers reduce operational overhead by up to 40%, recover lost jar deposits, and increase collection efficiency through instant digital tracking.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Key Features of Our RO Plant Management Software
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition">
              <div className="text-blue-600 shrink-0"><Truck className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Route Tracking & Planning</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Optimize delivery routes across multiple areas to save time, reduce fuel consumption, and ensure timely jar delivery.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition">
              <div className="text-blue-600 shrink-0"><Users className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Customer Management</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Keep a digital profile of every customer. Store their address, contact details, standard daily jar requirements, and rates.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition">
              <div className="text-blue-600 shrink-0"><Receipt className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Water Supply Billing Software</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Automatically calculate charges based on delivered quantities. Generate digital invoices and detailed ledgers in seconds.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition">
              <div className="text-blue-600 shrink-0"><Calendar className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delivery Logs & Schedule</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Track delivery progress (Pending, Completed, In Progress) in real-time. Staff can log jar collections with a single click.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition">
              <div className="text-blue-600 shrink-0"><MessageSquare className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">WhatsApp Reminders</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Send automated payment reminders and pending balance notifications to customers directly on WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition">
              <div className="text-blue-600 shrink-0"><Database className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Jar Inventory Monitoring</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Track empty and filled 20-litre jars at the depot and in the field. Know exactly which customer has how many jars.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Built for Indian Businesses */}
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="text-blue-600 w-6 h-6" />
            <h2 className="text-xl md:text-2xl font-bold text-blue-900">Tailored for Indian Water Suppliers</h2>
          </div>
          <p className="text-sm md:text-base text-slate-700 leading-relaxed">
            From regional cash collection mechanisms to daily jar deposit accounts and subscription cycles, JalSejiwan has been designed with an intuitive, mobile-friendly interface suited for local delivery agents, drivers, and depot owners alike. Whether you manage a small local delivery route with 50 water jars or operate a large multi-franchise RO water plant delivering thousands of bottles daily across major Indian hubs, JalSejiwan scales beautifully.
          </p>
          <p className="text-sm text-slate-600 font-semibold">
            Join the digital revolution. Maximize efficiency, minimize losses, and build long-term trust with your customers.
          </p>
        </div>

        {/* Action / Back block */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-6 border-t border-slate-100">
          <Link href="/" className="text-blue-600 font-semibold hover:underline">
            &larr; Back to Home Page
          </Link>
          <Link href="/login" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-sm hover:bg-blue-700 transition w-full sm:w-auto text-center">
            Go to App Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
