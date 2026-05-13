'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import { Search, MapPin, CheckCircle2, Droplet, Plus, Truck, Wallet, Phone, Navigation, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAppContext } from '@/app/context/AppContext';

export default function DeliveriesList() {
  const { deliveries, customers, routes, setDeliveries } = useAppContext();
  const [filter, setFilter] = useState('All');
  const [date, setDate] = useState('2026-03-27');
  const [routeFilter, setRouteFilter] = useState('All Routes');

  const updatePriority = (deliveryId: number, priority: 'High' | 'Medium' | 'Low') => {
    setDeliveries(deliveries.map(d => d.id === deliveryId ? { ...d, priority } : d));
  };

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    window.location.reload();
  };

  const todaysDeliveries = deliveries.filter(d => d.date === date && (routeFilter === 'All Routes' || customers.find(c => c.id === d.customerId)?.route === routeFilter));
  
  const completedCount = todaysDeliveries.filter(d => d.status === 'Delivered').length;
  const pendingCount = todaysDeliveries.filter(d => d.status === 'Pending').length;
  const skippedCount = todaysDeliveries.filter(d => d.status === 'Skipped').length;

  const filteredDeliveries = todaysDeliveries.filter(d => {
    if (filter === 'All') return true;
    return d.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Jal Sejiwan" showBack={true} />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="max-w-md mx-auto px-4 py-6">
          {/* Filters */}
        <div className="flex gap-2 mb-6">
          <input 
            type="date" 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 flex-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 flex-1"
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
          >
            <option value="All Routes">All Routes</option>
            {routes.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Header Stats */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-blue-600 mb-6">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Deliveries on {date}</div>
          <div className="text-4xl font-bold text-slate-900 mb-2">{todaysDeliveries.length}</div>
          <div className="text-sm text-slate-600">{pendingCount} Remaining</div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Done</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{completedCount}</div>
          </div>
          <div className="bg-orange-50 rounded-2xl p-3 border border-orange-100 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-orange-600 text-sm">⏱</span>
              <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Pending</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{pendingCount}</div>
          </div>
          <div className="bg-red-50 rounded-2xl p-3 border border-red-100 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Skipped</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{skippedCount}</div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Pending', 'Delivered', 'Skipped'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Delivery List */}
        <div className="space-y-3">
          {filteredDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mb-4">
                <Truck className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No deliveries found</h3>
              <p className="text-slate-500 mb-6 max-w-[250px]">
                You have no deliveries scheduled for the selected date and filters.
              </p>
            </div>
          ) : (
            filteredDeliveries.map(delivery => {
              const customer = customers.find(c => c.id === delivery.customerId);
              if (!customer) return null;

              if (delivery.status === 'Pending') {
                return (
                  <div key={delivery.id} className={`bg-white rounded-2xl p-4 border ${customer.due > 0 ? 'border-r-4 border-r-red-600 border-slate-100' : 'border-slate-100'} flex flex-col gap-3`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${customer.due > 0 ? 'bg-red-50' : 'bg-blue-50'}`}>
                        {customer.due > 0 ? <Wallet className="w-6 h-6 text-red-600" /> : <Droplet className="w-6 h-6 text-blue-600 fill-current" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-lg">{customer.name}</h3>
                          {customer.due > 0 && <span className="bg-red-100 text-red-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Due ₹{customer.due}</span>}
                          {delivery.priority && (
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              delivery.priority === 'High' ? 'bg-red-100 text-red-700' :
                              delivery.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {delivery.priority} Priority
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex items-center gap-1 text-xs text-slate-500 uppercase tracking-wider">
                            <MapPin className="w-3 h-3" /> {customer.address}
                          </div>
                          <select
                            value={delivery.priority || 'Medium'}
                            onChange={(e) => updatePriority(delivery.id, e.target.value as 'High' | 'Medium' | 'Low')}
                            className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-blue-500 ml-2 uppercase"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => window.location.href = `tel:${customer.phone}`} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform">
                        <Phone className="w-4 h-4" /> Call
                      </button>
                      <button onClick={() => window.open(`https://maps.google.com/?q=${customer.address}`)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform">
                        <Navigation className="w-4 h-4" /> Map
                      </button>
                      <Link href={`/staff/skip/${delivery.id}`} className="flex-1 bg-orange-100 text-orange-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform">
                        <XCircle className="w-4 h-4" /> Skip
                      </Link>
                      <Link href={`/staff/delivery/${delivery.id}`} className="flex-[1.5] bg-blue-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform">
                        Deliver <Truck className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              }

              if (delivery.status === 'Delivered') {
                return (
                  <div key={delivery.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-4 opacity-70">
                    <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-700 text-lg line-through decoration-slate-300">{customer.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 uppercase tracking-wider mt-1">
                        <MapPin className="w-3 h-3" /> {customer.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivered</div>
                      <div className="text-xs text-slate-400 mt-1">{delivery.deliveredQty} Cans</div>
                    </div>
                  </div>
                );
              }

              if (delivery.status === 'Skipped') {
                return (
                  <div key={delivery.id} className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-center gap-4 opacity-80">
                    <div className="w-12 h-12 rounded-xl bg-white border-2 border-red-200 flex items-center justify-center shrink-0">
                      <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-900 text-lg">{customer.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-red-500 uppercase tracking-wider mt-1">
                        <MapPin className="w-3 h-3" /> {customer.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Skipped</div>
                      <div className="text-xs text-red-400 mt-1 font-bold">{delivery.skipReason || delivery.note}</div>
                      {delivery.skipRemarks && <div className="text-[10px] text-red-400 mt-0.5">{delivery.skipRemarks}</div>}
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      </main>
      </PullToRefresh>

      <BottomNav role="owner" activeTab="deliveries" />
    </div>
  );
}
