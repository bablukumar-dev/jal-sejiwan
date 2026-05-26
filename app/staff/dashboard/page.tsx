'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Route, FileText, Plus, Wallet, Droplet, ArrowRight, ChevronRight, X, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect } from 'react';
import { auth } from '@/firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function StaffDashboard() {
  const { deliveries, payments, staff } = useAppContext();
  const [userName, setUserName] = useState('');
  const [staffRoute, setStaffRoute] = useState('');
  const [currentStaffId, setCurrentStaffId] = useState<number | null>(null);
  
  useEffect(() => {
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
  
  const todaysDeliveries = deliveries.filter(d => d.date === today && d.staffId === currentStaffId);
  const totalTarget = todaysDeliveries.length;
  const completedDeliveries = todaysDeliveries.filter(d => d.status === 'Delivered').length;
  const completionPercentage = totalTarget > 0 ? Math.round((completedDeliveries / totalTarget) * 100) : 0;

  const cashCollected = payments.filter(p => p.date === today).reduce((sum, p) => sum + p.amount, 0);
  const emptyReturned = todaysDeliveries.reduce((sum, d) => sum + d.returnedEmpty, 0);
  const skippedCount = deliveries.filter(d => d.status === 'Skipped').length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Jal Sejiwan" showBack={false} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">{userName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">{staffRoute || 'No Route'}</span>
            {staffRoute && <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Active Route</span>}
          </div>
        </div>

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

        {/* Route Summary */}
        <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Route Summary</h3>
          <div className="space-y-3">
            <div onClick={() => setIsSummaryModalOpen(true)} className="bg-white rounded-xl p-4 flex items-center justify-between border border-slate-200 active:scale-95 transition-transform cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-900">Daily Summary</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div onClick={() => setIsPaymentModalOpen(true)} className="bg-white rounded-xl p-4 flex items-center justify-between border border-slate-200 active:scale-95 transition-transform cursor-pointer">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-900">Payment Ledger</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
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
