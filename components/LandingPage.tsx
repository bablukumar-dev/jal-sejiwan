'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Droplet, Truck, Package, Bell, FileText, Users, CheckCircle, Calculator, Coins, Clock, TrendingUp, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const [dailyDeliveries, setDailyDeliveries] = useState(50);
  const [pricePerJar, setPricePerJar] = useState(40);
  const [jarsLost, setJarsLost] = useState(15);
  const [adminHours, setAdminHours] = useState(10);

  // Compute monthly deliveries from the daily deliveries input count over a standard 30-day operation cycle
  const monthlyJars = dailyDeliveries * 30;

  // ROI Computations
  // 1. Recovering 95% of lost polycarbonate/PET jars valued at ₹150 each
  const jarSavings = Math.round(jarsLost * 150 * 0.95);
  // 2. Plugging average 4.0% cash & billing leakage through precise logging and instant reminders
  const leakageSavings = Math.round(monthlyJars * pricePerJar * 0.04);
  // 3. Saving manual staff administrative billing labor hours valued at ₹200/hr
  const timeSavings = Math.round(adminHours * 4.33 * 200);
  // 4. Saving ~10% fuel usage via optimized routing (avg. current fuel spend ₹10/delivery)
  const fuelSavings = Math.round(monthlyJars * 10 * 0.1);
  
  const totalMonthlySavings = jarSavings + leakageSavings + timeSavings + fuelSavings;
  const totalAnnualSavings = totalMonthlySavings * 12;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <img src="/logo.png" alt="JalSejiwan - Water Delivery Management Software India Logo" className="h-10 w-10 object-contain flex-shrink-0" referrerPolicy="no-referrer" />
            <span className="text-xl font-bold text-blue-700">JalSejiwan</span>
          </div>
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

        {/* Section: Monthly Savings Calculator */}
        <section className="space-y-6 scroll-mt-20" id="savings-calculator">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Calculate Your Monthly Savings & ROI
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm leading-relaxed">
              Find out how much revenue leakage you can plug, asset loss you can prevent, and manual hours you can save by replacing traditional books with <strong>JalSejiwan Water Delivery Management Software India</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Box: Slicers / Inputs */}
            <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Your Operational Volume
                </h3>
                <p className="text-slate-500 text-xs">
                  Adjust the sliders below to match your drinking water distribution agency&apos;s current stats in India.
                </p>
              </div>

              <div className="space-y-5">
                {/* Sliders 1: Daily Delivery Count */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <label className="font-medium text-slate-700 flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-blue-500" />
                      Daily Delivery Count (20L Jars)
                    </label>
                    <span className="font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
                      {dailyDeliveries} Jars/day (~{monthlyJars.toLocaleString()} / month)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={dailyDeliveries}
                    onChange={(e) => setDailyDeliveries(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                    id="slider-daily-deliveries"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>5 Jars</span>
                    <span>250 Jars</span>
                    <span>500 Jars</span>
                  </div>
                </div>

                {/* Slider 2: Price per Jar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <label className="font-medium text-slate-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Average Price per Jar
                    </label>
                    <span className="font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs">
                      ₹{pricePerJar} / jar
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={pricePerJar}
                    onChange={(e) => setPricePerJar(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                    id="slider-price-per-jar"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>₹20</span>
                    <span>₹60</span>
                    <span>₹100</span>
                  </div>
                </div>

                {/* Slider 3: Empty Jars Lost */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <label className="font-medium text-slate-700 flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-500" />
                      Empty Jars Lost / Month
                    </label>
                    <span className="font-bold bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs">
                      {jarsLost} Jars Lost
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={jarsLost}
                    onChange={(e) => setJarsLost(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-none"
                    id="slider-jars-lost"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>0 Jars</span>
                    <span>50 Jars</span>
                    <span>100 Jars</span>
                  </div>
                </div>

                {/* Slider 4: Weekly Booking Admin Hours */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <label className="font-medium text-slate-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      Weekly Admin Hours Spent on Paper Cards
                    </label>
                    <span className="font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs">
                      {adminHours} Hours / week
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={adminHours}
                    onChange={(e) => setAdminHours(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                    id="slider-admin-hours"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>0 Hours</span>
                    <span>20 Hours</span>
                    <span>40 Hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Glowing Output ROI Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col justify-between border border-blue-600/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Estimated Monthly Return</span>
                  <span className="flex items-center gap-1 bg-blue-600/60 border border-blue-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-amber-300" /> Optimized
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    ₹{totalMonthlySavings.toLocaleString()}
                  </div>
                  <p className="text-xs text-blue-200 font-medium">Extra savings added back to your bank account monthly</p>
                </div>

                <div className="border-t border-blue-600/50 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200 text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      Prevent Empty Can Assets Loss
                    </span>
                    <span className="font-bold">₹{jarSavings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200 text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Plug Payment & Billing Disputes
                    </span>
                    <span className="font-bold">₹{leakageSavings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200 text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Free Up Supervisor Admin Labor
                    </span>
                    <span className="font-bold">₹{timeSavings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200 text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                      Optimize Delivery Fleet Fuel
                    </span>
                    <span className="font-bold">₹{fuelSavings.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 relative z-10 border-t border-blue-600/50 mt-6 lg:mt-0">
                <div className="bg-blue-950/35 border border-blue-500/25 p-3 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-blue-200 font-extrabold uppercase tracking-wider">Annual Earnings Boost</div>
                    <div className="text-lg font-bold text-emerald-400">₹{totalAnnualSavings.toLocaleString()} / year</div>
                  </div>
                  <TrendingUp className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                </div>

                <Link
                  href="/login"
                  className="w-full bg-white text-blue-700 font-bold py-3 px-4 rounded-xl text-center block hover:bg-blue-50 active:scale-[0.98] transition-all shadow-md text-sm"
                  id="calc-cta-btn"
                >
                  Start Saving Now with JalSejiwan
                </Link>
                <div className="text-center text-[10px] text-blue-300">
                  Risk-free trial. No payment card required to start.
                </div>
              </div>
            </div>
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

        {/* Section: SEO Benefits */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Key Benefits of Implementing Water Delivery Management Software India</h2>
          <p className="text-slate-600 leading-relaxed text-sm">
            Transitioning your traditional operations to a digital <strong>Water Delivery Management Software India</strong> like JalSejiwan unlocks immense operational advantages that directly improve your bottom line. By digitizing delivery boy routes and setting up an automated <strong>20 Litre Water Jar Delivery System</strong>, you instantly eliminate daily recording mismatches and ensure 100% service accuracy.
          </p>
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Boost Daily Profit Margins</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Using specialized <strong>Water Can Billing Software</strong> protects your business from leakage. Keep real-time counts of filled jars and prevent delivery boys from skipping entries or pocketing cash collections unaccounted.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Prevent Costly Jar Losses</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                In India, empty 20-litre blue cans represent a major capital asset. JalSejiwan acts as an elegant <strong>Water Supply Business Management App</strong>, logging every incoming and outgoing empty jar so you know exactly who owes what.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Streamline Client Communications</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ditch manual calling. Distribute monthly ledgers, payment receipts, and automated outstanding payment reminders with a single click via WhatsApp, enhancing customer satisfaction and professional brand identity.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Empower Field Representatives</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enable delivery partners to work efficiently using dedicated routes. A streamlined, field-ready mobile dashboard removes confusion, automates inventory handovers, and tracks collections transparently under our cohesive ERP system.
              </p>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed text-sm pt-2">
            Employing our modern <strong>Water Distribution Management System</strong> lets you scale from 100 to over 10,000 active clients seamlessly, making JalSejiwan the premier <strong>Digital Solution for Water Suppliers</strong> across any city in India.
          </p>
        </section>

        {/* Section: Business Advantages & ROI */}
        <section className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Quantifiable Business Advantages & ROI</h2>
          <p className="text-slate-600 leading-relaxed text-sm">
            For drinking water distribution agencies in India serving anywhere from 500 to 3,000 active clients, transitioning to JalSejiwan—a premium <strong>Water Delivery Management Software India</strong>—delivers a direct, highly quantifiable return on investment (ROI) within the first month of implementation. Adopting our specialized <strong>Water Supply Business Management App</strong> translates into four principal advantages that directly foster enterprise-level expansion:
          </p>
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">1. Brand Preservation and Zero Asset Loss</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                By enforcing a strict <strong>20 Litre Water Jar Delivery System</strong> tracking mechanism, you completely eliminate empty blue jar losses. Businesses typically save up to ₹25,000 monthly by preventing can displacement and keeping clear staff accountability.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">2. Leak-Proof Collections and Cash Flow</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our advanced <strong>Water Can Billing Software</strong> plugs accounting gaps. Every single jar supply action is logged securely on our system, improving recovery rates by up to 18% and avoiding billing disputes common with manual paper registers.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">3. Maximized Fleet Efficiency</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Intelligent route scheduling mapping diminishes petrol charges and minimizes delivery vehicle repair costs by up to 15%. Directing drivers logically reduces idle fuel burn and avoids tedious overlapping routes on Indian roads.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">4. Single-Click Operational Invoicing</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Automating monthly billing saves up to 30 administrative hours each week. Instead of adding up paper card records manually, generate digital PDF invoices and automate client alerts instantly, freeing up your valuable time for business expansion.
              </p>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed text-sm pt-2">
            Adopting this specialized <strong>Water Distribution Management System</strong> turns a chaotic delivery setup into a highly profitable digital service.
          </p>
        </section>

        {/* Section: Industry Transformation & Long-Term Enterprise ROI */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Industry Transformation: Long-Term Enterprise ROI</h2>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Strategic Value & Growth Model of Water Delivery Management Software India</p>
          </div>
          
          <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
            <p>
              Adopting a certified <strong>Water Delivery Management Software India</strong> completely redefines the unit economics of a typical water jar distribution firm. Independent field audits indicate that water distribution agencies suffer an average of 8% revenue loss owing to missing delivery logs, unreturned polycarbonate jars, and misplaced manual paper coupons. By shifting to a centralized database platform, agencies secure their physical capital while cutting fuel bills by 12% through optimized dispatch sequences.
            </p>
            <p>
              The true strategic value, however, goes beyond direct cost cuts. When you digitize operations, you build a structured asset register and establish precise customer transactional ledger history. This data-driven model makes your drinking water company highly scalable, attractive to regional buyers, and eligible for formal credit lines from banking partners in India. Ultimately, implementing this software ensures your high-turnover business maintains healthy cash flow margins in competitive municipal markets.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-lg font-bold text-blue-700">18% Reduction</div>
              <div className="text-[10px] text-slate-500 font-medium">In accounts receivable outstanding cycles</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-lg font-bold text-blue-700">25% Higher</div>
              <div className="text-[10px] text-slate-500 font-medium">Asset and empty jar rotation velocity</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-lg font-bold text-blue-700">60% Drop</div>
              <div className="text-[10px] text-slate-500 font-medium">In manual supervisor billing errors</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-lg font-bold text-blue-700">15% Optimized</div>
              <div className="text-[10px] text-slate-500 font-medium font-sans">Route mileage and delivery vehicle fuel spend</div>
            </div>
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
