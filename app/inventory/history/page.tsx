'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Calendar, Filter, AlertTriangle, Settings, Plus, Truck, User } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useState } from 'react';
import Link from 'next/link';

export default function InventoryHistory() {
  const { inventoryHistory } = useAppContext();
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT' | 'DAMAGE'>('ALL');

  const filteredHistory = inventoryHistory.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'IN' && item.type === 'Stock In') return true;
    if (filter === 'OUT' && item.type === 'Stock Out') return true;
    if (filter === 'DAMAGE' && item.type === 'Damage') return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Jal Sejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Inventory History</h1>
          <p className="text-sm text-slate-600">Log of all stock movements for 20L Cans & Chillers.</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-200/50 rounded-xl p-3 flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-slate-500" />
          <span className="text-sm text-slate-600 font-medium">Filter by date range</span>
        </div>

        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setFilter('ALL')}
            className={`flex-1 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform ${filter === 'ALL' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}
          >
            <Filter className="w-3 h-3" /> ALL ACTIVITY
          </button>
          <button 
            onClick={() => setFilter('IN')}
            className={`flex-1 font-bold py-3 rounded-xl text-xs active:scale-95 transition-transform ${filter === 'IN' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}
          >
            IN
          </button>
          <button 
            onClick={() => setFilter('OUT')}
            className={`flex-1 font-bold py-3 rounded-xl text-xs active:scale-95 transition-transform ${filter === 'OUT' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}
          >
            OUT
          </button>
          <button 
            onClick={() => setFilter('DAMAGE')}
            className={`flex-1 font-bold py-3 rounded-xl text-xs active:scale-95 transition-transform ${filter === 'DAMAGE' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}
          >
            DAMAGE
          </button>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {filteredHistory.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                item.type === 'Damage' ? 'bg-red-100 text-red-600' :
                item.type === 'Stock In' ? 'bg-blue-100 text-blue-600' :
                item.type === 'Stock Out' ? 'bg-slate-200 text-slate-600' :
                'bg-orange-100 text-orange-700'
              }`}>
                {item.type === 'Damage' && <AlertTriangle className="w-6 h-6" />}
                {item.type === 'Stock In' && <Plus className="w-6 h-6" />}
                {item.type === 'Stock Out' && <Truck className="w-6 h-6" />}
                {item.type === 'Adjustment' && <Settings className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${
                    item.type === 'Damage' ? 'text-red-600' :
                    item.type === 'Stock In' ? 'text-blue-700' :
                    item.type === 'Stock Out' ? 'text-slate-600' :
                    'text-orange-700'
                  }`}>{item.type}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">• {item.date}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2">{item.note || item.type}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <User className="w-4 h-4" /> {item.type === 'Damage' ? 'Reported by' : item.type === 'Stock In' ? 'Logged by' : item.type === 'Stock Out' ? 'Dispatched by' : 'Verified by'} {item.source}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  item.type === 'Damage' || item.type === 'Stock Out' ? 'text-red-600' :
                  item.type === 'Stock In' ? 'text-blue-700' :
                  'text-orange-700'
                }`}>
                  {item.type === 'Damage' || item.type === 'Stock Out' ? '-' : '+'}{Math.abs(item.qty)}
                </div>
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Units</div>
              </div>
            </div>
          ))}
        </div>

        <button 
          type="button"
          onClick={() => alert("All logs loaded: no older logs found in localized storage.")}
          className="w-full mt-6 py-4 border-2 border-dashed border-slate-300 rounded-2xl text-xs font-bold text-slate-600 uppercase tracking-wider active:scale-95 transition-transform"
        >
          Load Older Logs
        </button>

      </main>

      {/* FAB */}
      <Link href="/inventory/reconciliation" className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-2xl shadow-lg shadow-blue-600/30 z-40 active:scale-90 duration-200 flex items-center justify-center">
        <Plus className="w-6 h-6" />
      </Link>

      <BottomNav role="owner" activeTab="more" />
    </div>
  );
}
