import React, { useMemo } from 'react';
import { Customer, Delivery, Payment, Staff } from '@/app/context/AppContext';
import { TrendingUp, Users, DollarSign, Award } from 'lucide-react';

export function AnalyticsDashboardSection({
  customers,
  deliveries,
  payments,
  staff
}: {
  customers: Customer[],
  deliveries: Delivery[],
  payments: Payment[],
  staff: Staff[]
}) {

  const stats = useMemo(() => {
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    // Aggregating monthly revenue
    const monthlyRevenue = payments.reduce((sum, p) => {
      if (p.date.startsWith(currentMonthStr)) sum += p.amount;
      return sum;
    }, 0);

    // Daily delivery count (Completed only)
    const todayStr = today.toISOString().split('T')[0];
    const dailyDeliveries = deliveries.filter(d => d.date === todayStr && d.status === 'Completed').length;

    // Outstanding Dues
    const totalDues = customers.reduce((sum, c) => sum + (c.due || 0), 0);

    // Top Performing Staff (by deliveries this month)
    const staffPerformance: Record<string, number> = {};
    deliveries.forEach(d => {
      if (d.status === 'Completed' && d.date.startsWith(currentMonthStr)) {
        staffPerformance[d.staffName] = (staffPerformance[d.staffName] || 0) + d.deliveredQty;
      }
    });
    const topStaff = Object.entries(staffPerformance).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    // Customer growth rate (simplified: active customers)
    const activeCustomersCount = customers.filter(c => c.active).length;

    return { monthlyRevenue, dailyDeliveries, totalDues, topStaff, activeCustomersCount };
  }, [customers, deliveries, payments]);

  return (
    <div className="mt-8 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Business Analytics</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Monthly Revenue</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{stats.monthlyRevenue}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Customers</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.activeCustomersCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-blue-100">
               <Award className="w-4 h-4" />
               <span className="text-[10px] font-bold uppercase tracking-wider">Top Performing Staff</span>
            </div>
            <div className="text-xl font-bold">{stats.topStaff[0]}</div>
            <div className="text-sm text-blue-200 mt-1">{stats.topStaff[1]} total deliveries this month</div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10">
            <TrendingUp className="w-24 h-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
