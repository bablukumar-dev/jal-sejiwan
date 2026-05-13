'use client';

import Image from 'next/image';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Users, UserPlus, Search, Phone, Route, Filter } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useState } from 'react';

export default function StaffManagement() {
  const { staff } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStaff = staff.filter(s => {
    const query = searchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(query) ||
           s.phone?.includes(searchQuery) ||
           s.route?.toLowerCase().includes(query);
  });

  const totalDeliveriesMTD = staff.length * 150; // Mock value since deliveriesMTD is not in Staff type

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Jal Sejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Header Stats */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Staff Monthly Performance</div>
            <div className="text-4xl font-bold text-blue-700 mb-1">{totalDeliveriesMTD.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Total Deliveries this month</div>
          </div>
          <div className="flex items-end gap-1 h-16">
            <div className="w-3 bg-blue-200 rounded-t-sm h-1/3"></div>
            <div className="w-3 bg-blue-300 rounded-t-sm h-1/2"></div>
            <div className="w-3 bg-blue-400 rounded-t-sm h-2/3"></div>
            <div className="w-3 bg-blue-600 rounded-t-sm h-full"></div>
            <div className="w-3 bg-blue-300 rounded-t-sm h-3/4"></div>
          </div>
        </div>

        {/* Manage Workforce Action */}
        <div className="bg-blue-700 rounded-3xl p-6 text-white mb-6">
          <Users className="w-8 h-8 mb-4 text-blue-300" />
          <h2 className="text-xl font-bold mb-1">Manage Workforce</h2>
          <p className="text-blue-200 text-sm mb-6">Add or update staff member details and assigned routes.</p>
          <button className="w-full bg-white text-blue-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <UserPlus className="w-5 h-5" /> Add New Staff
          </button>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 space-y-3">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search staff by name, route or phone..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-200/50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform border border-slate-200">
            <Filter className="w-4 h-4" /> FILTER
          </button>
        </div>

        {/* Staff List */}
        <div className="space-y-4">
          {filteredStaff.map((s) => (
            <div key={s.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm relative">
                    <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`} alt="avatar" fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{s.name}</h3>
                    <div className="text-xs text-slate-500">Emp ID: {s.id.toString().padStart(3, '0')}-402</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.active ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {s.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-slate-700 text-sm">{s.phone}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Route className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Route</div>
                    <div className="font-medium text-slate-900 text-sm">{s.route}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center px-2">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deliveries (MTD)</div>
                  <div className="font-bold text-blue-700 text-lg">150</div>
                </div>
                <button className="text-xs font-bold text-blue-700 uppercase tracking-wider active:scale-95 transition-transform">
                  {s.active ? 'View History' : 'Re-Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>

      </main>

      <BottomNav role="owner" activeTab="reports" />
    </div>
  );
}
