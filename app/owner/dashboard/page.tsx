'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { Truck, Wallet, Droplet, Package, AlertTriangle, UserPlus, FileText, Users, Bell, Droplets, Activity } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect, useMemo } from 'react';
import { wrapRoute } from '@/lib/permissionGuard';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import { safeGet } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { checkClientRateLimit } from '@/lib/rateLimit';
import { checkMonthlyAutoReminder, runBulkReminder } from '@/lib/reminderService';
import { logActivity } from '@/lib/activityLogger';

import dynamic from 'next/dynamic';

// Lazy load heavy components
const LossDetectionWidget = dynamic(() => import('@/components/LossDetectionWidget').then(mod => mod.LossDetectionWidget), {
  ssr: false,
  loading: () => <div className="p-4 bg-slate-50 rounded-2xl animate-pulse h-32" />
});
const AnalyticsDashboardSection = dynamic(() => import('@/components/AnalyticsSection').then(mod => mod.AnalyticsDashboardSection), {
  ssr: false,
  loading: () => <div className="p-4 bg-slate-50 rounded-2xl animate-pulse h-64" />
});

// Import hook separately
import { useLossDetection } from '@/components/LossDetectionWidget';

function OwnerDashboard() {
  const router = useRouter();
  const { customers: rawCustomers, deliveries, payments, inventory, businessInfo, staff, currentUser } = useAppContext();

  const customers = useMemo(() => {
    return Array.from(
      new Map((rawCustomers || []).map(item => [item.id, item])).values()
    );
  }, [rawCustomers]);
  const [isReminding, setIsReminding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userRole, setUserRole] = useState<string>(() => {
    return safeGet('userRole') || 'owner';
  });
  const [userName, setUserName] = useState<string>(() => {
    const role = safeGet('userRole');
    if (role === 'owner') {
      return businessInfo.ownerName || 'Owner';
    } else {
      return safeGet('staffUserName') || 'Manager';
    }
  });

  const warnings = useLossDetection(customers, deliveries, inventory, payments);

  const pendingCustomers = useMemo(() => customers.filter(c => c.due > 0).length, [customers]);

  useEffect(() => {
    const role = safeGet('userRole');
    if (role) {
      requestAnimationFrame(() => {
        setUserRole(role);
        if (role === 'owner') {
          setUserName(businessInfo.ownerName || 'Owner');
        } else {
          setUserName(safeGet('staffUserName') || 'Manager');
        }
      });
    }
  }, [businessInfo.ownerName]);


  useEffect(() => {
    if (currentUser && currentUser.role === 'owner') {
      if (currentUser.dashboardTourCompleted === false) {
        requestAnimationFrame(() => {
          setShowOnboarding(true);
        });
      }
    }
  }, [currentUser]);

  // Auto Monthly Reminder Check
  useEffect(() => {
    const doAutoMinder = async () => {
      await checkMonthlyAutoReminder(customers, businessInfo);
    };
    doAutoMinder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessInfo, pendingCustomers]);

  const handleRemindAll = async () => {
    // Implement Max 1 time per day constraint tracking lastSentDate
    const todayStr = new Date().toISOString().split('T')[0];
    const lastSentDate = localStorage.getItem('lastSentDateRemindAll');
    if (lastSentDate === todayStr) {
      alert('🔔 WhatsApp reminders have already been sent today! Limit is max 1 time per day.');
      return;
    }

    const limitStatus = checkClientRateLimit('bulk_reminders', 2, 600); // 2 times per 10 minutes
    if (limitStatus.limited) {
      alert(limitStatus.msg || 'Too many bulk reminder attempts. Please try again later.');
      return;
    }

    if (!confirm(`Are you sure you want to send reminders to ${pendingCustomers} customers?`)) return;
    
    setIsReminding(true);
    try {
      const result = await runBulkReminder(customers, businessInfo);
      if (result.success) {
        localStorage.setItem('lastSentDateRemindAll', todayStr);
        logActivity({
          module: 'Communication',
          action: 'Bulk Reminders Sent',
          description: `Sent payment reminders to ${result.count} customers`,
          status: 'success',
          metadata: { count: result.count }
        });
        alert(`Successfully sent reminders to ${result.count} customers!`);
      } else {
        logActivity({
          module: 'Communication',
          action: 'Bulk Reminders Failed',
          description: `Failed to send bulk reminders`,
          status: 'error'
        });
        alert('Failed to send some reminders.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to send some reminders.');
    } finally {
      setIsReminding(false);
    }
  };

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todaysDeliveries = useMemo(() => deliveries.filter(d => d.date === today), [deliveries, today]);
  const todayDeliveriesCount = todaysDeliveries.length;
  const pendingDeliveriesCount = useMemo(() => todaysDeliveries.filter(d => d.status === 'Pending').length, [todaysDeliveries]);
  const cansDelivered = useMemo(() => todaysDeliveries.reduce((sum, d) => sum + d.deliveredQty, 0), [todaysDeliveries]);
  const emptyReturned = useMemo(() => todaysDeliveries.reduce((sum, d) => sum + d.returnedEmpty, 0), [todaysDeliveries]);
  
  const cashCollected = useMemo(() => payments.filter(p => p.date === today).reduce((sum, p) => sum + p.amount, 0), [payments, today]);
  const totalDue = useMemo(() => customers.reduce((sum, c) => sum + c.due, 0), [customers]);

  const totalCustomers = customers.length;
  const deliveryPercentage = useMemo(() => totalCustomers > 0 ? Math.round((todayDeliveriesCount / totalCustomers) * 100) : (todayDeliveriesCount > 0 ? 100 : 0), [todayDeliveriesCount, totalCustomers]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 antialiased pb-12 flex flex-col justify-start">
      <div className="w-full max-w-[480px] mx-auto bg-white min-h-screen shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-x border-slate-100 flex flex-col relative rounded-t-3xl md:rounded-b-3xl overflow-visible pb-24">
        <TopAppBar 
          title="JalSejiwan" 
          subtitle={`Namaste, ${(userName || 'User').split(' ')[0]} Ji`} 
          showBack={false} 
          showProfile={true} 
        />

        <main className="w-full p-4 flex-1 flex flex-col gap-4">
        {/* Infrastructure Status */}
        {currentUser?.waterSystemSetup && (
          <div id="onboarding-infrastructure">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Infrastructure Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div id="onboarding-water-tanks" className="bg-emerald-600 rounded-2xl p-4 text-white shadow-sm flex flex-col justify-between h-24">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Water Tank</span>
                  <Droplets className="w-4 h-4" />
                </div>
                <div className="text-sm font-bold truncate">{currentUser.waterSystemSetup.tankName}</div>
              </div>
              <div id="onboarding-pump-stations" className="bg-slate-700 rounded-2xl p-4 text-white shadow-sm flex flex-col justify-between h-24">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Pump Station</span>
                  <Activity className="w-4 h-4" />
                </div>
                <div className="text-sm font-bold truncate">{currentUser.waterSystemSetup.pumpStationName}</div>
              </div>
            </div>
          </div>
        )}

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
              <div className="bg-blue-200 rounded-2xl p-5 text-blue-900 shadow-sm flex flex-col justify-between h-28">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">In Market</span>
                    <Truck className="w-4 h-4" />
                </div>
                <div className="text-3xl font-bold">{inventory.cansWithCustomers + inventory.cansInDelivery}</div>
              </div>
              <div className="bg-red-100 rounded-2xl p-5 text-red-900 shadow-sm flex flex-col justify-between h-28">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Damaged</span>
                    <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-3xl font-bold">{inventory.damagedCans}</div>
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
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">Target Reached</span>
            <span className="font-bold text-slate-900">{deliveryPercentage}%</span>
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
              <div className="text-xs text-emerald-600 mt-1">Today&apos;s collection</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Outstanding Due</h3>
              <div className="text-2xl font-bold text-orange-600">₹{totalDue}</div>
              <div className="text-xs text-slate-500 mt-1">{pendingCustomers} Pending Customers</div>
            </div>
          </div>
        </div>

        {/* Remind All Due button */}
        {pendingCustomers > 0 && userRole === 'owner' && (
          <button 
           onClick={handleRemindAll}
           disabled={isReminding}
           className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm border border-orange-300 disabled:opacity-50"
          >
            <Bell className="w-5 h-5 text-orange-600" />
            {isReminding ? 'Sending Reminders...' : '🔔 Remind All Due Customers'}
          </button>
        )}

        {/* Smart Loss Detection */}
        <LossDetectionWidget warnings={warnings} />

        <AnalyticsDashboardSection 
          customers={customers}
          deliveries={deliveries}
          payments={payments}
          staff={staff}
        />


        {/* Live Command Station */}

        {/* Quick Operations */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 mt-6">Quick Operations</h3>
          <div className="grid grid-cols-2 gap-3">
            {(userRole === 'owner' || userRole === 'manager' || userRole === 'staff') && (
              <button id="onboarding-add-customer" onClick={() => router.push(userRole === 'staff' ? '/staff/customers/add' : '/owner/customers/add')} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full">
                <UserPlus className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Add Customer</span>
              </button>
            )}
            {(userRole === 'owner' || userRole === 'manager') && (
              <button id="onboarding-deliveries" onClick={() => router.push('/owner/deliveries')} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full">
                <Truck className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Deliveries</span>
              </button>
            )}
            {(userRole === 'owner' || userRole === 'manager') && (
              <button id="onboarding-payments" onClick={() => router.push('/owner/payments')} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full">
                <span className="text-xl font-bold text-blue-600">₹</span>
                <span className="text-sm font-medium text-slate-700">Payments</span>
              </button>
            )}
            {(userRole === 'owner' || userRole === 'manager') && (
              <button onClick={() => router.push('/owner/reports')} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full">
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Reports</span>
              </button>
            )}
            {userRole === 'owner' && (
              <button onClick={() => router.push('/owner/staff')} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full">
                <Users className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Staff</span>
              </button>
            )}
          </div>
        </div>

      </main>

      <BottomNav role={userRole} activeTab="dashboard" />

      {showOnboarding && (
        <OnboardingOverlay onClose={() => setShowOnboarding(false)} />
      )}
      </div>
    </div>
  );
}

export default wrapRoute(OwnerDashboard, { requiredRole: 'owner', strict: true });
