'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Route, FileText, Plus, Wallet, Droplet, ArrowRight, ChevronRight, X, LifeBuoy, UserPlus, Truck, Users } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect } from 'react';
import { auth } from '@/firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function StaffDashboard() {
  const { customers, deliveries, payments, inventory, staff, businessInfo } = useAppContext();
  const [userName, setUserName] = useState('');
  const [staffRoute, setStaffRoute] = useState('');
  const [currentStaffId, setCurrentStaffId] = useState<number | null>(null);
  
  useEffect(() => {
    // Check PIN-based authentication first
    const pinAuth = typeof window !== 'undefined' ? localStorage.getItem('pinAuth') : null;
    const localStaffId = typeof window !== 'undefined' ? localStorage.getItem('staffUserId') : null;

    if (pinAuth === 'true' && localStaffId) {
      const currentStaff = staff.find(s => String(s.id) === localStaffId);
      if (currentStaff) {
        setUserName(currentStaff.name);
        if (currentStaff.route) {
          setStaffRoute(currentStaff.route);
        }
        setCurrentStaffId(currentStaff.id);
      }
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserName(user.displayName || user.email?.split('@')[0] || 'User');
        // Find staff route if any
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/firebase');
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role === 'staff') {
             // In a real app we might link staff document in `staff` context
             // For now we check if there's a matching staff in context
             const currentStaff = staff.find(s => s.phone === userDoc.data().phone || s.name === userDoc.data().name);
             if (currentStaff) {
               if (currentStaff.route) {
                 setStaffRoute(currentStaff.route);
               }
               setCurrentStaffId(currentStaff.id);
             }
          }
        } catch (e) {
           console.error(e);
        }
      }
    });
    return () => unsubscribe();
  }, [staff]);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  
  const todaysDeliveries = deliveries.filter(d => d.date === today && (currentStaffId !== null ? d.staffId === currentStaffId : true));
  const totalTarget = todaysDeliveries.length;
  const completedDeliveries = todaysDeliveries.filter(d => d.status === 'Delivered').length;
  const completionPercentage = totalTarget > 0 ? Math.round((completedDeliveries / totalTarget) * 100) : 0;

  const cashCollected = payments.filter(p => p.date === today && p.collectedBy === userName).reduce((sum, p) => sum + p.amount, 0);
  const emptyReturned = todaysDeliveries.reduce((sum, d) => sum + d.returnedEmpty, 0);
  const skippedCount = deliveries.filter(d => d.status === 'Skipped' && d.staffId === currentStaffId).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 w-full">
        <div className="flex justify-between items-center px-4 h-16 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Overview</span>
              <h1 className="text-xl font-bold text-slate-900">Namaste, {userName.split(' ')[0]} <span className="text-blue-600 font-normal">(Manager)</span></h1>
            </div>
          </div>
        </div>
      </header>

<main className="max-w-md mx-auto p-4 space-y-4">

        {/* Target Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Today&apos;s Target</div>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-6xl font-bold text-blue-700 leading-none">{completedDeliveries}</span>
            <span className="text-2xl font-bold text-slate-400 mb-1">/ {totalTarget}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 mb-2">
            <span>{completionPercentage}% Done</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 border-l-4 border-l-blue-600">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cash Collected</div>
            <div className="text-xs text-slate-400 mb-2">Paisa Mila</div>
            <div className="text-2xl font-bold text-slate-900 mb-4">₹{cashCollected}</div>
            <div className="flex justify-end">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 border-l-4 border-l-orange-600">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Empties</div>
            <div className="text-xs text-slate-400 mb-2">Khali Bottle</div>
            <div className="text-2xl font-bold text-slate-900 mb-4">{emptyReturned} Units</div>
            <div className="flex justify-end">
              <Droplet className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Start Route Action */}
        <Link href="/staff/customers" className="block bg-blue-700 rounded-3xl p-6 text-white mb-6 active:scale-95 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600/50 rounded-2xl flex items-center justify-center shrink-0">
              <Route className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">View All</div>
              <h2 className="text-xl font-bold">MY CUSTOMERS</h2>
            </div>
            <ArrowRight className="w-6 h-6" />
          </div>
        </Link>

        {/* Customer Service Action */}
        <Link href="/staff/service" className="block bg-orange-600 rounded-3xl p-6 text-white mb-6 active:scale-95 transition-transform relative overflow-hidden shadow-md shadow-orange-600/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-500/50 rounded-2xl flex items-center justify-center shrink-0">
              <LifeBuoy className="w-8 h-8 animate-spin-slow" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-orange-200 uppercase tracking-wider mb-1">Re-attempts & Skip Resolve</div>
              <h2 className="text-xl font-bold">CUSTOMER SERVICE</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {skippedCount > 0 && (
                <span className="bg-white text-orange-700 font-bold text-xs px-2.5 py-1 rounded-full shadow-sm">
                  {skippedCount}
                </span>
              )}
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
        </Link>

        {/* Quick Operations */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 mt-6">Quick Operations</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link id="onboarding-add-customer" href="/owner/customers/add" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <UserPlus className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Add Customer</span>
            </Link>
            <Link id="onboarding-deliveries" href="/owner/deliveries" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <Truck className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Deliveries</span>
            </Link>
            <Link id="onboarding-payments" href="/owner/payments" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <span className="text-xl font-bold text-blue-600">₹</span>
              <span className="text-sm font-medium text-slate-700">Payments</span>
            </Link>
            <Link href="/owner/reports" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Reports</span>
            </Link>
            <Link href="/owner/staff" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Staff</span>
            </Link>
          </div>
        </div>

      </main>

      {/* FAB */}
      <Link href="/owner/customers/add" className="fixed bottom-24 right-6 bg-blue-600 text-white w-16 h-16 rounded-2xl shadow-lg shadow-blue-600/30 z-40 active:scale-90 duration-200 flex items-center justify-center">
        <Plus className="w-8 h-8" />
      </Link>

      {/* Modals */}
      <AnimatePresence>
        {isSummaryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => setIsSummaryModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-xl font-bold text-slate-900">Daily Summary</h2>
                <button onClick={() => setIsSummaryModalOpen(false)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {todaysDeliveries.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No deliveries recorded today.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between border-b pb-2">
                       <span className="text-slate-500">Total Assigned</span>
                       <span className="font-bold">{totalTarget}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span className="text-slate-500">Delivered</span>
                       <span className="font-bold text-blue-600">{completedDeliveries}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span className="text-slate-500">Empties Returned</span>
                       <span className="font-bold text-orange-600">{emptyReturned}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span className="text-slate-500">Pending</span>
                       <span className="font-bold text-slate-900">{totalTarget - completedDeliveries}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => setIsPaymentModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-xl font-bold text-slate-900">Payment Ledger</h2>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                 {payments.filter(p => p.date === today).length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No payments collected today.</p>
                 ) : (
                    <div className="space-y-3">
                      {payments.filter(p => p.date === today).map(p => (
                         <div key={p.id} className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                               <div className="font-bold text-slate-800">{p.customerName}</div>
                               <div className="text-xs text-slate-500">{p.mode}</div>
                            </div>
                            <div className="font-bold text-green-600">₹{p.amount}</div>
                         </div>
                      ))}
                    </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav role="staff" activeTab="dashboard" />
    </div>
  );
}
