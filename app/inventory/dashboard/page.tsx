'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Package, ArrowUpRight, ArrowDownLeft, AlertTriangle, CheckCircle2, Droplet, MapPin, Calendar, Factory, Truck, Wrench, ArrowRightLeft, Activity } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect } from 'react';

export default function InventoryDashboard() {
  const { inventory, inventoryHistory } = useAppContext();
  const [userRole, setUserRole] = useState<'owner' | 'manager'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole');
      if (stored === 'owner' || stored === 'manager') return stored;
    }
    return 'owner';
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Stock Command Center" subtitle="Operational Overview" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Date */}
        <div className="bg-slate-200 rounded-lg px-3 py-2 inline-flex items-center gap-2 mb-6">
          <Calendar className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-bold text-slate-900">MAR 27, 2026</span>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-700 rounded-2xl p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Droplet className="w-4 h-4 fill-current" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Full Stock</span>
            </div>
            <div className="text-3xl font-bold mb-1">{inventory.fullCans}</div>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-200">
              <ArrowUpRight className="w-3 h-3" /> Ready for Dispatch
            </div>
          </div>

          <div className="bg-slate-200 rounded-2xl p-5 text-slate-900 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Empty Stock</span>
            </div>
            <div className="text-3xl font-bold mb-1">{inventory.emptyCans}</div>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Factory className="w-3 h-3" /> Needs Refilling
            </div>
          </div>

          <div className="bg-blue-200 rounded-2xl p-5 text-blue-900 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">In Market</span>
            </div>
            <div className="text-3xl font-bold mb-1">{inventory.cansWithCustomers + inventory.cansInDelivery}</div>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
              <MapPin className="w-3 h-3" /> With Customers
            </div>
          </div>

          <div className="bg-red-100 rounded-2xl p-5 text-red-900 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-4 h-4 fill-current" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Damaged</span>
            </div>
            <div className="text-3xl font-bold mb-1">{inventory.damagedCans}</div>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
              <Wrench className="w-3 h-3" /> Awaiting Repair
            </div>
          </div>
        </div>

        {/* Quick Operations */}
        <div className="mb-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Operations</h3>
          <div className="space-y-3">
            <Link href="/owner/activity" className="bg-gradient-to-r from-indigo-700 to-blue-800 rounded-2xl p-4 flex items-center gap-4 text-white active:scale-95 transition-transform shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-lg">Live Activity Feed</h4>
                <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Real-time Operational Signals
                </div>
              </div>
            </Link>

            <Link href="/inventory/dispatch" className="bg-blue-700 rounded-2xl p-4 flex items-center gap-4 text-white active:scale-95 transition-transform shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Dispatch</h4>
                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Stock Outflow</div>
              </div>
            </Link>
            
            <Link href="/inventory/reconciliation" className="w-full bg-slate-100 rounded-2xl p-4 flex items-center gap-4 text-slate-900 active:scale-95 transition-transform border border-slate-200 text-left">
              <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Stock Return</h4>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inflow Management</div>
              </div>
            </Link>

            <Link href="/inventory/reconciliation" className="w-full bg-orange-50 rounded-2xl p-4 flex items-center gap-4 text-slate-900 active:scale-95 transition-transform border border-orange-100">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 text-orange-700">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-lg">Reconciliation</h4>
                <div className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Audit & Tally</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Inventory Health */}
        <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 mb-8 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <CheckCircle2 className="w-32 h-32 -mb-8 -mr-8" />
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Inventory Health</div>
          <div className="text-4xl font-bold text-blue-700 mb-4 relative z-10">98.2%</div>
          <div className="w-full bg-slate-300 rounded-full h-2 mb-4 relative z-10">
            <div className="bg-blue-700 h-2 rounded-full" style={{ width: '98.2%' }}></div>
          </div>
          <p className="text-xs text-slate-600 relative z-10">System scan complete. No critical stock discrepancies detected today.</p>
        </div>

        {/* Stock Movements */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Real-Time Log</div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Stock Movements</h3>
          
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Ref ID</th>
                  <th className="p-4">Activity</th>
                  <th className="p-4">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryHistory.map(history => (
                  <tr key={history.id}>
                    <td className="p-4 font-bold text-slate-900">#{history.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${history.type === 'Dispatch' ? 'bg-blue-100 text-blue-700' : history.type === 'Return' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                          {history.type === 'Dispatch' ? <ArrowUpRight className="w-3 h-3" /> : history.type === 'Return' ? <ArrowDownLeft className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        </div>
                        <span className="font-medium">{history.type}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{history.qty} {history.type === 'Dispatch' ? 'Full' : history.type === 'Return' ? 'Empty' : 'Cans'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <BottomNav role={userRole} activeTab={userRole === 'manager' ? 'dashboard' : 'inventory'} />
    </div>
  );
}
