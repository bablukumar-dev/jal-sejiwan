'use client';

import BottomNav from '@/components/BottomNav';
import { Truck, Wallet, Droplet, ArrowRight, FileText, ChevronRight, Route } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect } from 'react';
import { auth } from '@/firebase';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import TopAppBar from '@/components/TopAppBar';

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
          if (currentStaff.route) {
            setStaffRoute(currentStaff.route);
          }
          setCurrentStaffId(currentStaff.id);
        });
      }
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        requestAnimationFrame(() => {
          setUserName(user.displayName || user.email?.split('@')[0] || 'User');
        });
        // Find staff route if any
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/firebase');
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role === 'staff') {
             const currentStaff = staff.find(s => s.phone === userDoc.data().phone || s.name === userDoc.data().name);
             if (currentStaff) {
                requestAnimationFrame(() => {
                  if (currentStaff.route) {
                    setStaffRoute(currentStaff.route);
                  }
                  setCurrentStaffId(currentStaff.id);
                });
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
  
  const targetDeliveries = 50; 
  const deliveryPercentage = Math.round((todayDeliveriesCount / targetDeliveries) * 100) || 0;

  const cashCollected = payments.filter(p => p.date === today && p.collectedBy === userName).reduce((sum, p) => sum + p.amount, 0);
  const emptiesCount = todaysDeliveries.reduce((sum, d) => sum + (d.returnedEmpty || 0), 0) || 18;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <TopAppBar title="Jal Seva" />
      
      <main className="max-w-md mx-auto p-4">
        {/* Header Section */}
        <div className="pt-2 pb-6">
          <h1 className="text-2xl font-bold text-slate-900">{userName || 'Staff'}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase">
              {staffRoute || 'SECTOR 45'}
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
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Today's Target</h3>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-6xl font-bold text-blue-700 leading-none">{todayDeliveriesCount}</span>
            <span className="text-2xl font-medium text-slate-400 mb-1">/{targetDeliveries}</span>
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
        <Link href="/staff/customers" className="bg-blue-700 hover:bg-blue-800 text-white rounded-2xl p-5 flex items-center justify-between transition-colors shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Route className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Next Stop</div>
              <div className="text-xl font-bold">START MY ROUTE</div>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-white" />
        </Link>

        {/* Secondary Section */}
        <div className="bg-slate-100/60 rounded-2xl p-5 border border-slate-200/50">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Route Summary</h3>
          <div className="space-y-3">
            <Link href="/staff/customers" className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                 <FileText className="w-5 h-5 text-blue-700" />
                 <span className="font-bold text-slate-900">Daily Summary</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link href="/staff/customers" className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                 <Wallet className="w-5 h-5 text-blue-700" />
                 <span className="font-bold text-slate-900">Payment Ledger</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
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
