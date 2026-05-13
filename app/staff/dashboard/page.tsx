'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Route, FileText, Plus, Wallet, Droplet, ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';

export default function StaffDashboard() {
  const { deliveries, payments } = useAppContext();
  
  const today = '2026-03-27';
  const staffId = 1; // Mock logged-in staff ID

  const todaysDeliveries = deliveries.filter(d => d.date === today && d.staffId === staffId);
  const totalTarget = todaysDeliveries.length;
  const completedDeliveries = todaysDeliveries.filter(d => d.status === 'Delivered').length;
  const completionPercentage = totalTarget > 0 ? Math.round((completedDeliveries / totalTarget) * 100) : 0;

  const cashCollected = payments.filter(p => p.date === today).reduce((sum, p) => sum + p.amount, 0);
  const emptyReturned = todaysDeliveries.reduce((sum, d) => sum + d.returnedEmpty, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Jal Sejiwan" showBack={false} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Rajesh Kumar</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">Sector 45</span>
            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Active Route</span>
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
        <Link href="/staff/route" className="block bg-blue-700 rounded-3xl p-6 text-white mb-6 active:scale-95 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600/50 rounded-2xl flex items-center justify-center shrink-0">
              <Route className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">Next Stop</div>
              <h2 className="text-xl font-bold">START MY ROUTE</h2>
            </div>
            <ArrowRight className="w-6 h-6" />
          </div>
        </Link>

        {/* Route Summary */}
        <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Route Summary</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 flex items-center justify-between border border-slate-200 active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-900">Daily Summary</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="bg-white rounded-xl p-4 flex items-center justify-between border border-slate-200 active:scale-95 transition-transform">
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
      <button className="fixed bottom-24 right-6 bg-blue-600 text-white w-16 h-16 rounded-2xl shadow-lg shadow-blue-600/30 z-40 active:scale-90 duration-200 flex items-center justify-center">
        <Plus className="w-8 h-8" />
      </button>

      <BottomNav role="staff" activeTab="dashboard" />
    </div>
  );
}
