'use client';

import Image from 'next/image';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { CheckCircle2, Droplet, Plus, Minus, RefreshCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';

export default function DispatchScreen() {
  const router = useRouter();
  const { staff, setInventory } = useAppContext();
  const [dispatched, setDispatched] = useState(45);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(staff.length > 0 ? staff[0].id : null);
  const [emptyReceived, setEmptyReceived] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'manager'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole');
      if (stored === 'owner' || stored === 'manager') return stored;
    }
    return 'owner';
  });

  const selectedStaff = staff.find(s => s.id === selectedStaffId);

  const handleConfirm = () => {
    if (!selectedStaff) return;

    setInventory(prev => ({
      ...prev,
      fullCans: prev.fullCans - dispatched,
      cansInDelivery: prev.cansInDelivery + dispatched
    }));

    // In a real app, we would log this dispatch to history
    router.push('/inventory/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Jal Sejiwan" subtitle="Dispatch Unit" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">STOCK DISPATCH</h1>
          <p className="text-sm text-slate-600 mt-1">Outbound Logistics Entry • Sector 45 Hub</p>
        </div>

        {/* Select Staff */}
        <div className="mb-6">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Select Delivery Staff</label>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {staff.filter(s => s.active).map(s => (
              <div 
                key={s.id}
                onClick={() => setSelectedStaffId(s.id)}
                className={`min-w-[140px] border-2 rounded-2xl p-4 flex flex-col items-center relative cursor-pointer transition-all ${selectedStaffId === s.id ? 'bg-white border-blue-600 shadow-sm' : 'bg-slate-100 border-transparent opacity-60'}`}
              >
                {selectedStaffId === s.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                )}
                <div className={`w-16 h-16 rounded-full overflow-hidden mb-3 relative ${selectedStaffId === s.id ? 'bg-blue-100 border-2 border-blue-200' : 'bg-slate-200 grayscale'}`}>
                  <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`} alt="avatar" fill className="object-cover" />
                </div>
                <h3 className={`font-bold ${selectedStaffId === s.id ? 'text-blue-700' : 'text-slate-700'}`}>{s.name}</h3>
                <div className={`text-[8px] font-bold uppercase tracking-wider mt-1 ${selectedStaffId === s.id ? 'text-blue-600' : 'text-slate-500'}`}>Route: {s.route}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch Input */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Cans Dispatched</h2>
              <div className="text-sm text-slate-500 mt-1">20L Purified Water Bottles</div>
            </div>
            <Droplet className="w-6 h-6 text-blue-600 fill-current" />
          </div>

          <div className="bg-slate-100 rounded-2xl p-3 flex items-center justify-between">
            <button 
              onClick={() => setDispatched(Math.max(0, dispatched - 1))}
              className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <Minus className="w-8 h-8 text-blue-600" />
            </button>
            <div className="text-center">
              <div className="text-5xl font-bold text-slate-900">{dispatched}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Bottles</div>
            </div>
            <button 
              onClick={() => setDispatched(dispatched + 1)}
              className="w-16 h-16 bg-blue-700 rounded-xl flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Empty Cans Received Toggle */}
        <div className="bg-slate-100 rounded-2xl p-5 flex items-center justify-between mb-6 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Empty Cans Received?</h3>
              <div className="text-xs text-slate-500">Verify returns from previous route</div>
            </div>
          </div>
          <div 
            className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors ${emptyReceived ? 'bg-blue-600' : 'bg-slate-300'}`}
            onClick={() => setEmptyReceived(!emptyReceived)}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${emptyReceived ? 'right-1' : 'left-1'}`}></div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-300 border-dashed mb-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Dispatch Summary (Kul Vivran)</h3>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Assigned Staff</span>
              <span className="font-bold text-slate-900">{selectedStaff?.name || 'None'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Vehicle ID</span>
              <span className="font-bold text-slate-900">DL-1RC-4492</span>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Total Stock Value</span>
            <span className="text-xl font-bold text-blue-700">₹ {(dispatched * 50).toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={handleConfirm}
          disabled={!selectedStaff || dispatched === 0}
          className="w-full bg-blue-700 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-blue-700/30 disabled:opacity-50 disabled:active:scale-100"
        >
          <CheckCircle2 className="w-6 h-6" /> CONFIRM DISPATCH
        </button>

      </main>

      <BottomNav role={userRole} activeTab="dispatch" />
    </div>
  );
}
