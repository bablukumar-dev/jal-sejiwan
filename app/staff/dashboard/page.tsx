'use client';

import BottomNav from '@/components/BottomNav';
import { Truck, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect } from 'react';
import { auth } from '@/firebase';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import OnlineStatusBadge from '@/components/OnlineStatusBadge';

export default function StaffDashboard() {
  const { customers, deliveries, payments, inventory, staff, businessInfo } = useAppContext();
  const [userName, setUserName] = useState('');
  const [staffRoute, setStaffRoute] = useState('');
  const [currentStaffId, setCurrentStaffId] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    // Check PIN-based authentication first
    const pinAuth = typeof window !== 'undefined' ? localStorage.getItem('pinAuth') : null;
    const localStaffId = typeof window !== 'undefined' ? localStorage.getItem('staffUserId') : null;

    if (pinAuth === 'true' && localStaffId) {
      const currentStaff = staff.find(s => String(s.id) === localStaffId);
      if (currentStaff) {
        requestAnimationFrame(() => {
          setUserName(currentStaff.name);
        });
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

  const today = new Date().toISOString().split('T')[0];
  const todaysDeliveries = deliveries.filter(d => d.date === today && (currentStaffId !== null ? d.staffId === currentStaffId : true));
  const todayDeliveriesCount = todaysDeliveries.length;
  
  const cashCollected = payments.filter(p => p.date === today && p.collectedBy === userName).reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 w-full">
        <div className="flex justify-between items-center px-4 h-16 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Overview</span>
              <h1 className="text-xl font-bold text-slate-900">Namaste, {userName.split(' ')[0]} <span className="text-blue-600 font-normal">(Staff)</span></h1>
            </div>
          </div>
          <div>
            <OnlineStatusBadge />
          </div>
        </div>
      </header>
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Date Selector */}
        <div className="bg-white rounded-xl p-3 flex items-center gap-3 border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <span className="text-slate-500 text-sm">📅</span>
          </div>
          <span className="font-medium text-sm">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        {/* Deliveries Today */}
        <div className="block bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-5">
            <Truck className="w-24 h-24 text-slate-400" />
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">My Deliveries Today</h3>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-bold text-slate-900">{todayDeliveriesCount}</span>
          </div>
        </div>

        {/* Financials */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cash Collected</h3>
              <div className="text-2xl font-bold text-slate-900">₹{cashCollected}</div>
              <div className="text-xs text-emerald-600 mt-1">Today&apos;s collection</div>
            </div>
          </div>
        </div>

        {/* Quick Operations */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 mt-6">Quick Operations</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/staff/customers" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <Truck className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Assigned Deliveries</span>
            </Link>
            <Link href="/staff/customers" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <Wallet className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Payment Entry</span>
            </Link>
          </div>
        </div>

      </main>

      <BottomNav role="staff" activeTab="dashboard" />
      
      {showOnboarding && (
        <OnboardingOverlay onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
