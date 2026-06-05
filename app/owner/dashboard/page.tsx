'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Truck, Wallet, Droplet, Package, AlertTriangle, UserPlus, FileText, Users, Bell } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect } from 'react';
import { wrapRoute } from '@/lib/permissionGuard';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import OnlineStatusBadge from '@/components/OnlineStatusBadge';
import { safeGet } from '@/lib/utils';
import { useRouter } from 'next/navigation';

function OwnerDashboard() {
  const router = useRouter();
  const { customers, deliveries, payments, inventory, businessInfo } = useAppContext();
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

  const pendingCustomers = customers.filter(c => c.due > 0).length;

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
    const ownerId = safeGet('ownerId');
    const userRole = safeGet('userRole');
    if (ownerId && userRole === 'owner') {
      const localCompleted = safeGet(`onboardingCompleted_${ownerId}`);
      if (localCompleted !== 'true') {
        const checkDb = async () => {
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/firebase');
            const userSnap = await getDoc(doc(db, 'users', ownerId));
            if (userSnap.exists()) {
              const uData = userSnap.data();
              if (uData.onboardingCompleted === true) {
                localStorage.setItem(`onboardingCompleted_${ownerId}`, 'true');
              } else {
                setShowOnboarding(true);
              }
            } else {
              setShowOnboarding(true);
            }
          } catch (e) {
            console.error("Failed to query onboardingCompleted status", e);
            setShowOnboarding(true);
          }
        };
        checkDb();
      }
    }
  }, []);

  // Auto Monthly Reminder Check
  useEffect(() => {
    const doAutoMinder = async () => {
      const { checkMonthlyAutoReminder } = await import('@/lib/reminderService');
      await checkMonthlyAutoReminder(customers, businessInfo);
    };
    doAutoMinder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessInfo, pendingCustomers]);

  const handleRemindAll = async () => {
    if (!confirm(`Are you sure you want to send reminders to ${pendingCustomers} customers?`)) return;
    
    setIsReminding(true);
    try {
      const { runBulkReminder } = await import('@/lib/reminderService');
      const result = await runBulkReminder(customers, businessInfo);
      if (result.success) {
        alert(`Successfully sent reminders to ${result.count} customers!`);
      } else {
        alert('Failed to send some reminders.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to send some reminders.');
    } finally {
      setIsReminding(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysDeliveries = deliveries.filter(d => d.date === today);
  const todayDeliveriesCount = todaysDeliveries.length;
  const pendingDeliveriesCount = todaysDeliveries.filter(d => d.status === 'Pending').length;
  const cansDelivered = todaysDeliveries.reduce((sum, d) => sum + d.deliveredQty, 0);
  const emptyReturned = todaysDeliveries.reduce((sum, d) => sum + d.returnedEmpty, 0);
  
  const cashCollected = payments.filter(p => p.date === today).reduce((sum, p) => sum + p.amount, 0);
  const totalDue = customers.reduce((sum, c) => sum + c.due, 0);

  const targetDeliveries = 150; // Mock target
  const deliveryPercentage = Math.round((todayDeliveriesCount / targetDeliveries) * 100) || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 w-full">
        <div className="flex justify-between items-center px-4 h-16 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Overview</span>
              <h1 className="text-xl font-bold text-slate-900">
                Namaste, {(userName || 'User').split(' ')[0]} Ji{' '}
                <span className="text-blue-600 font-normal">
                  ({userRole === 'manager' ? 'Manager' : 'Owner'})
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OnlineStatusBadge />
            <Link href="/settings" className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
              <div className="w-full h-full bg-blue-600" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
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
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deliveries Today</h3>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-bold text-slate-900">{todayDeliveriesCount}</span>
            <span className="text-xl font-medium text-slate-400 mb-1">/{targetDeliveries}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">Target Reached</span>
            <span className="font-bold text-slate-900">{deliveryPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${deliveryPercentage}%` }}></div>
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
        {pendingCustomers > 0 && (
          <button 
           onClick={handleRemindAll}
           disabled={isReminding}
           className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm border border-orange-300 disabled:opacity-50"
          >
            <Bell className="w-5 h-5 text-orange-600" />
            {isReminding ? 'Sending Reminders...' : '🔔 Remind All Due Customers'}
          </button>
        )}

        <div className="grid grid-cols-2 gap-4 mt-2 mb-2">
            {/* AI Forecast */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-20">
                    <span className="text-4xl">✨</span>
                </div>
                <h3 className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1 flex items-center gap-1">AI Revenue Forecast</h3>
                <div className="text-xl font-bold text-indigo-950">₹{Math.round(customers.length * businessInfo.defaultRate * 30 * 0.9)}</div>
                <div className="text-[9px] text-indigo-700 mt-1">Expected next 30 days based on active plans</div>
            </div>

            {/* Smart Loss Detection */}
            {inventory.cansWithCustomers > (inventory.fullCans + inventory.emptyCans + inventory.cansInDelivery) * 0.2 && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                <h3 className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1 flex items-center gap-1">Loss Detection <AlertTriangle className="w-3 h-3"/></h3>
                <div className="text-lg font-bold text-red-950">{inventory.cansWithCustomers} Empties</div>
                <div className="text-[9px] text-red-700 mt-1">High number of empty cans stuck with customers</div>
            </div>
            )}
        </div>


        {/* Live Command Station */}

        {/* Quick Operations */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 mt-6">Quick Operations</h3>
          <div className="grid grid-cols-2 gap-3">
            {(userRole === 'owner' || userRole === 'manager') && (
              <button id="onboarding-add-customer" onClick={() => router.push('/owner/customers/add')} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full">
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
  );
}

export default wrapRoute(OwnerDashboard, { requiredRole: 'manager' });
