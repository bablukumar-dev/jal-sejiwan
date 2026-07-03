'use client';

import BottomNav from '@/components/BottomNav';
import { Truck, Wallet, Droplet, ArrowRight, FileText, ChevronRight, Route, Download } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/src/supabaseClient';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import TopAppBar from '@/components/TopAppBar';

export default function StaffDashboard() {
  const { customers, deliveries, payments, inventory, staff, businessInfo, currentUser } = useAppContext();
  const [userName, setUserName] = useState('');
  const [staffRoute, setStaffRoute] = useState('');
  const [currentStaffId, setCurrentStaffId] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

  const downloadMonthlyStatement = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const filteredPayments = payments.filter(p => {
      const pDate = new Date(p.date);
      return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });
    
    doc.text(`Monthly Statement - ${currentYear}-${currentMonth + 1}`, 14, 15);
    autoTable(doc, {
      head: [['Date', 'Customer', 'Amount', 'Mode']],
      body: filteredPayments.map(p => [p.date, p.customerName, p.amount.toString(), p.mode]),
    });
    doc.save(`Statement-${currentYear}-${currentMonth + 1}.pdf`);
  };

  useEffect(() => {
    // 1. Check PIN-based authentication first (Staff specific login)
    const pinAuth = typeof window !== 'undefined' ? localStorage.getItem('pinAuth') : null;
    const localStaffId = typeof window !== 'undefined' ? localStorage.getItem('staffUserId') : null;

    if (pinAuth === 'true' && localStaffId) {
      const currentStaff = staff.find(s => String(s.id) === localStaffId);
      if (currentStaff) {
        requestAnimationFrame(() => {
          setUserName(currentStaff.name);
          if (currentStaff.route) setStaffRoute(currentStaff.route);
          setCurrentStaffId(currentStaff.id);
        });
        return;
      }
    }

    // 2. Otherwise use Clerk-based current user
    if (currentUser && currentUser.role === 'staff') {
      const staffMember = staff.find(s => s.id.toString() === currentUser.uid || s.name === (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('currentUser') || '{}').name : ''));
      
      // Fallback to name-based matching if UID doesn't match staff ID
      const userObj = staff.find(s => s.id.toString() === currentUser.uid) || staff.find(s => s.name === userName);

      requestAnimationFrame(() => {
        setUserName(currentUser.uid); // Default to UID if name unknown
        if (userObj) {
          setUserName(userObj.name);
          if (userObj.route) setStaffRoute(userObj.route);
          setCurrentStaffId(userObj.id);
        }
      });
    }
  }, [currentUser, staff, userName]);

  const today = new Date().toISOString().split('T')[0];
  const currentUserUid = currentStaffId ? String(currentStaffId) : (currentUser?.uid || '');

  // Filter deliveries assigned to current staff for today
  const todaysDeliveries = deliveries.filter(d => 
    d.date === today && 
    (currentStaffId !== null ? String(d.staffId) === String(currentUserUid) : true)
  );

  // STEP 1 — TODAY'S TARGET
  const totalTarget = todaysDeliveries.length;
  const completedCount = todaysDeliveries.filter(d => d.status === 'delivered').length;
  const deliveryPercentage = totalTarget > 0 ? Math.round((completedCount / totalTarget) * 100) : 0;

  // STEP 2 — CASH COLLECTED
  const currentBusinessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') || 'default_business' : 'default_business';
  const cashCollected = payments
    .filter(p => {
      const pBusinessId = p.businessId || 'default_business';
      return p.date === today && pBusinessId === currentBusinessId;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // STEP 3 & 4 — EMPTIES AND ASSIGNED ROUTE
  const emptiesCount = todaysDeliveries.reduce((sum, d) => sum + (d.returnedEmpty || 0), 0);
  const assignedRoute = deliveries.filter(d => 
    String(d.staffId) === String(currentUserUid) && d.status !== 'delivered'
  );

  // STEP 5 — PAYMENT LEDGER LIST
  const ledgerPayments = payments.filter(p => {
    const isToday = p.date === today;
    const isStaffPayment = String((p as any).staffId || '') === String(currentUserUid) || p.collectedBy === userName || p.collectedBy === 'Staff';
    return isToday && isStaffPayment;
  });

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 antialiased pb-12 flex flex-col justify-start">
      <div className="w-full max-w-[480px] mx-auto bg-white min-h-screen shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-x border-slate-100 flex flex-col relative rounded-t-3xl md:rounded-b-3xl overflow-visible pb-24">
        <TopAppBar title="JalSejiwan" showProfile={true} showBack={false} />
        
        <main className="w-full p-4 flex-1 flex flex-col gap-4">
        {/* Header Section */}
        <div className="pt-2 pb-6">
          <h1 className="text-2xl font-bold text-slate-900">{userName || 'Staff'}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase">
              {staffRoute || 'UNASSIGNED'}
            </span>
            <span className="text-blue-300 font-bold text-[10px] uppercase tracking-wider">
              Active Route
            </span>
          </div>
        </div>

        {/* Today's Target Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden mb-4">
          <div className="absolute top-4 right-4 opacity-5">
            <Truck className="w-32 h-32 text-slate-400" />
          </div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Today&apos;s Target</h3>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-6xl font-bold text-blue-700 leading-none">{completedCount}</span>
            <span className="text-2xl font-medium text-slate-400 mb-1">/{totalTarget}</span>
            <span className="ml-auto text-sm font-bold text-blue-700">{deliveryPercentage}% Done</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="bg-blue-700 h-3 rounded-full" style={{ width: `${Math.min(deliveryPercentage, 100)}%` }}></div>
          </div>
        </div>

        {/* Cash Collected & Empties Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between h-32 border-l-[3px] border-l-blue-800">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cash Collected</h3>
              <div className="text-[11px] font-medium text-slate-400">Paisa Mila</div>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-2xl font-bold text-slate-900">₹{cashCollected.toLocaleString()}</div>
              <Wallet className="w-5 h-5 text-blue-800" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between h-32 border-l-[3px] border-l-orange-800">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Empties</h3>
              <div className="text-[11px] font-medium text-slate-400">Khali Bottle</div>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-2xl font-bold text-slate-900">{emptiesCount} Units</div>
              <Droplet className="w-5 h-5 text-orange-800" />
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mb-6">
          <button onClick={() => setShowRoute(prev => !prev)} className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl p-5 flex items-center justify-between transition-colors shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Route className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Next Stop</div>
                <div className="text-xl font-bold">START MY ROUTE</div>
              </div>
            </div>
            <ChevronRight className={`w-6 h-6 text-white transition-transform ${showRoute ? 'rotate-90' : ''}`} />
          </button>
          
          {showRoute && (
            <div className="mt-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned Route</h4>
              {assignedRoute.length > 0 ? (
                assignedRoute.map(delivery => {
                  const customer = customers.find(c => c.id === delivery.customerId);
                  if (!customer) return null;
                  return (
                    <div key={delivery.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <div className="font-bold text-slate-900">{customer.name}</div>
                        <div className="text-xs text-slate-500">{customer.address}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-slate-500 text-center py-4">No customers assigned to this route.</div>
              )}
            </div>
          )}
        </div>

        {/* Secondary Section */}
        <div className="bg-slate-100/60 rounded-2xl p-5 border border-slate-200/50">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Route Summary</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button 
                onClick={() => setShowSummary(prev => !prev)}
                className="w-full p-4 flex items-center justify-between focus:outline-none"
              >
                <div className="flex items-center gap-3">
                   <FileText className="w-5 h-5 text-blue-700" />
                   <span className="font-bold text-slate-900">Daily Summary</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showSummary ? 'rotate-90' : ''}`} />
              </button>
              {showSummary && (
                <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm text-slate-600">Completed Deliveries</span>
                     <span className="font-bold text-slate-900">{completedCount}</span>
                   </div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm text-slate-600">Total Target</span>
                     <span className="font-bold text-slate-900">{totalTarget}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm text-slate-600">Completion</span>
                     <span className="font-bold text-blue-700">{deliveryPercentage}%</span>
                   </div>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button 
                onClick={() => setShowLedger(prev => !prev)}
                className="w-full p-4 flex items-center justify-between focus:outline-none"
              >
                <div className="flex items-center gap-3">
                   <Wallet className="w-5 h-5 text-blue-700" />
                   <span className="font-bold text-slate-900">Payment Ledger</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showLedger ? 'rotate-90' : ''}`} />
              </button>
              {showLedger && (
                <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50 space-y-2 max-h-60 overflow-y-auto">
                  {ledgerPayments.length > 0 ? (
                    ledgerPayments.map(payment => (
                      <div key={payment.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                        <span className="text-sm font-medium text-slate-700">{customers.find(c => c.id === payment.customerId)?.name || 'Unknown'}</span>
                        <span className="font-bold text-emerald-600">₹{payment.amount}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500 text-center py-2">No payments collected today.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      <BottomNav role="staff" activeTab="dashboard" />
      
      <button
        onClick={downloadMonthlyStatement}
        className="fixed bottom-24 right-4 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg z-50 flex items-center gap-2"
        title="Download Monthly Statement"
      >
        <Download className="w-6 h-6" />
      </button>

      {showOnboarding && (
        <OnboardingOverlay onClose={() => setShowOnboarding(false)} />
      )}
      </div>
    </div>
  );
}
