'use client';

import TopAppBar from '@/components/TopAppBar';
import { Plus, Minus, AlertTriangle, Printer, CheckCircle2, Truck } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { logActivity } from '@/lib/activityLogger';
import { wrapRoute } from '@/lib/permissionGuard';

function ReturnReconciliation() {
  const router = useRouter();
  const { staff, setInventory } = useAppContext();
  const [emptyReturned, setEmptyReturned] = useState(105);
  const [fullReturned, setFullReturned] = useState(12);
  const [damaged, setDamaged] = useState(0);
  const [localSelectedStaffId, setLocalSelectedStaffId] = useState<number | null>(null);

  const selectedStaffId = localSelectedStaffId ?? (staff.find(s => s.active)?.id || staff[0]?.id || null);
  const setSelectedStaffId = setLocalSelectedStaffId;

  const selectedStaff = staff.find(s => s.id === selectedStaffId);

  const totalDispatched = 120; // Mock value for now
  const missing = totalDispatched - (emptyReturned + fullReturned + damaged);

  const handleVerifyAndSave = () => {
    setInventory(prev => ({
      ...prev,
      fullCans: prev.fullCans + fullReturned,
      emptyCans: prev.emptyCans + emptyReturned,
      damagedCans: prev.damagedCans + damaged,
      cansInDelivery: prev.cansInDelivery - totalDispatched // Assuming all dispatched are accounted for
    }));

    logActivity({
      module: 'Inventory',
      action: 'Inventory Reconciled',
      description: `Reconciled stock for ${selectedStaff?.name || 'Staff'}: Empty returned ${emptyReturned}, unsold ${fullReturned}, damaged ${damaged}`,
      status: missing === 0 ? 'success' : 'warning',
      resourceType: 'Inventory',
      resourceId: selectedStaff?.id ? `STAFF-${selectedStaff.id}` : 'GENERAL',
      resourceName: selectedStaff?.name || 'Staff',
      newValue: {
        empty_returned: emptyReturned,
        full_returned: fullReturned,
        damaged: damaged,
        missing: missing
      }
    });

    router.push('/inventory/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="JalSejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Return Reconciliation</h1>
          <p className="text-sm text-slate-600">Verify stock counts for {selectedStaff?.name || 'Staff'}&apos;s daily route.</p>
        </div>

        {/* Select Staff */}
        <div className="mb-6">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Select Delivery Staff</label>
          <select 
            className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none text-slate-900 font-bold"
            value={selectedStaffId || ''}
            onChange={(e) => setSelectedStaffId(Number(e.target.value))}
          >
            <option value="" disabled>Select Staff</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.name} - {s.route}</option>
            ))}
            {staff.length === 0 && <option value="" disabled>No staff available - Please add staff</option>}
          </select>
        </div>

        {/* Dispatched Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Dispatched</div>
          <div className="text-5xl font-bold text-blue-700 mb-2">{totalDispatched}</div>
          <div className="text-sm text-slate-600 mb-4">Standard 20L Cans</div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <Truck className="w-4 h-4" /> Morning Load Out
          </div>
        </div>

        {/* Return Tracking */}
        <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Return Tracking</div>
              <h2 className="text-xl font-bold text-slate-900">Cans Returned</h2>
            </div>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Active Ledger</span>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-900 mb-3 block">Empty Cans (Khaali)</label>
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setEmptyReturned(Math.max(0, emptyReturned - 1))}
                  className="w-14 h-14 bg-slate-200 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Minus className="w-6 h-6 text-slate-700" />
                </button>
                <div className="text-4xl font-bold text-slate-900">{emptyReturned}</div>
                <button 
                  onClick={() => setEmptyReturned(emptyReturned + 1)}
                  className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-900 mb-3 block">Full Returns (Unsold)</label>
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setFullReturned(Math.max(0, fullReturned - 1))}
                  className="w-14 h-14 bg-slate-200 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Minus className="w-6 h-6 text-slate-700" />
                </button>
                <div className="text-4xl font-bold text-slate-900">{fullReturned}</div>
                <button 
                  onClick={() => setFullReturned(fullReturned + 1)}
                  className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loss & Damage */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-6 h-6 text-orange-700" />
            <h2 className="text-lg font-bold text-slate-900">Loss & Damage Entry</h2>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Damaged Cans</label>
            <div className="bg-slate-100 rounded-xl px-4 py-3 flex items-center justify-between">
              <input 
                type="number" 
                value={damaged}
                onChange={(e) => setDamaged(parseInt(e.target.value) || 0)}
                className="bg-transparent outline-none font-bold text-slate-900 text-lg w-full"
              />
              <span className="text-sm font-bold text-slate-600">Cans</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Leakage, broken seals, or physical damage</p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Notes / Reason</label>
            <textarea 
              placeholder="e.g. Accidental drop during unloading"
              className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none text-sm text-slate-900 resize-none h-20"
            ></textarea>
          </div>
        </div>

        {/* Final Reconciliation */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Final Reconciliation Logic</div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-6xl font-bold">{Math.abs(missing).toString().padStart(2, '0')}</span>
            <span className={`text-xl font-bold ${missing > 0 ? 'text-red-500' : missing < 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
              {missing > 0 ? 'Missing' : missing < 0 ? 'Extra' : 'Matched'}
            </span>
          </div>
          <p className="text-xs text-slate-400 text-center mb-6">
            {totalDispatched} (Out) - [{emptyReturned} (Empty) + {fullReturned} (Full) + {damaged} (Damaged)]
          </p>

          <div className="space-y-3">
            <button className="w-full bg-slate-200 text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Printer className="w-5 h-5" /> Print Slip
            </button>
            <button 
              onClick={handleVerifyAndSave}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <CheckCircle2 className="w-5 h-5" /> VERIFY & SAVE
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

export default wrapRoute(ReturnReconciliation, { requiredRole: 'manager' });
