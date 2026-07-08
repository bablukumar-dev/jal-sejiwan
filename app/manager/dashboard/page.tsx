'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { Truck, Wallet, Droplet, Package, AlertTriangle, UserPlus, FileText, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect, useMemo } from 'react';
import { wrapRoute } from '@/lib/permissionGuard';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import { safeGet } from '@/lib/utils';
import { useLossDetection, LossDetectionWidget } from '@/components/LossDetectionWidget';
import { AnalyticsDashboardSection } from '@/components/AnalyticsSection';

function ManagerDashboard() {
  const router = useRouter();
  const { customers: rawCustomers, deliveries, payments, inventory, businessInfo, staff, currentUser } = useAppContext();

  const customers = useMemo(() => {
    return Array.from(
      new Map((rawCustomers || []).map(item => [item.id, item])).values()
    );
  }, [rawCustomers]);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const userName = useMemo(() => {
    if (currentUser && currentUser.role === 'manager') {
      return currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    }
    return 'Manager';
  }, [currentUser]);

  const warnings = useLossDetection(customers, deliveries, inventory, payments);
  const pendingCustomers = useMemo(() => customers.filter(c => c.due > 0).length, [customers]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'manager') {
      if (currentUser.dashboardTourCompleted === false) {
        requestAnimationFrame(() => {
          setShowOnboarding(true);
        });
      }
    }
  }, [currentUser]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todaysDeliveries = useMemo(() => deliveries.filter(d => d.date === today), [deliveries, today]);
  const todayDeliveriesCount = todaysDeliveries.length;
  const cansDelivered = useMemo(() => todaysDeliveries.reduce((sum, d) => sum + d.deliveredQty, 0), [todaysDeliveries]);
  const totalCustomers = customers.length;
  const deliveryPercentage = useMemo(() => totalCustomers > 0 ? Math.round((todayDeliveriesCount / totalCustomers) * 100) : (todayDeliveriesCount > 0 ? 100 : 0), [todayDeliveriesCount, totalCustomers]);
  
  const cashCollected = useMemo(() => payments.filter(p => p.date === today).reduce((sum, p) => sum + p.amount, 0), [payments, today]);
  const totalDue = useMemo(() => customers.reduce((sum, c) => sum + c.due, 0), [customers]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 antialiased pb-12 flex flex-col justify-start">
      <div className="w-full max-w-[480px] mx-auto bg-white min-h-screen shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-x border-slate-100 flex flex-col relative rounded-t-3xl md:rounded-b-3xl overflow-visible pb-24">
        <TopAppBar 
          title="JalSejiwan" 
          subtitle={`Namaste, ${userName} Ji`} 
          showBack={false} 
          showProfile={true} 
        />

        <main className="w-full p-4 flex-1 flex flex-col gap-4">
          {/* Inventory Status */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Inventory Status</h3>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-700 rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between h-28">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Full Stock</span>
                      <Droplet className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-bold">{inventory.fullCans}</div>
                </div>
                <div className="bg-orange-500 rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between h-28">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-100">Empty Stock</span>
                      <Package className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-bold">{inventory.emptyCans}</div>
                </div>
            </div>
          </div>

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
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Today&apos;s Target</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold text-slate-900">{todayDeliveriesCount}</span>
              <span className="text-xl font-medium text-slate-400 mb-1">/{totalCustomers}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${deliveryPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              ></motion.div>
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
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Outstanding Due</h3>
                <div className="text-2xl font-bold text-orange-600">₹{totalDue}</div>
              </div>
            </div>
          </div>

          {/* Smart Loss Detection */}
          <LossDetectionWidget warnings={warnings} />

          <AnalyticsDashboardSection 
            customers={customers}
            deliveries={deliveries}
            payments={payments}
            staff={staff}
          />

          {/* Quick Operations */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 mt-6">Quick Operations</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => router.push('/owner/customers/add')} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full">
                <UserPlus className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Add Customer</span>
              </button>
              <button onClick={() => router.push('/owner/deliveries')} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full">
                <Truck className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Deliveries</span>
              </button>
              <button onClick={() => router.push('/owner/payments')} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full">
                <span className="text-xl font-bold text-blue-600">₹</span>
                <span className="text-sm font-medium text-slate-700">Payments</span>
              </button>
              <button onClick={() => router.push('/owner/reports')} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full">
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Reports</span>
              </button>
            </div>
          </div>
        </main>

        <BottomNav role="manager" activeTab="dashboard" />

        {showOnboarding && (
          <OnboardingOverlay onClose={() => setShowOnboarding(false)} />
        )}
      </div>
    </div>
  );
}

export default wrapRoute(ManagerDashboard, { requiredRole: 'manager', strict: true });
