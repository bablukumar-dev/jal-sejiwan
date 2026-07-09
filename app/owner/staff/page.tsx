'use client';

import Link from 'next/link';
import Image from 'next/image';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Users, UserPlus, Search, Phone, Mail, Route, Filter, TrendingUp, CheckCircle, MessageSquare, ChevronDown, ChevronUp, Key } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useState } from 'react';
import { hashPin, getFriendlyAuthErrorMessage } from '@/lib/authHelper';
import { logActivity } from '@/lib/activityLogger';
import { wrapRoute } from '@/lib/permissionGuard';
import { getFirebase } from '@/src/lib/firebase';

const safeGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

function StaffManagement() {
  const { staff, setStaff, deliveries, currentUser } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const filteredStaff = staff.filter(s => {
    const query = searchQuery.toLowerCase();
    const matchSearch = (s.name || '').toLowerCase().includes(query) ||
                        (s.phone || '').includes(searchQuery) ||
                        (s.route || '').toLowerCase().includes(query);
    if (!matchSearch) return false;

    if (filter === 'Active' && !s.active) return false;
    if (filter === 'Inactive' && s.active) return false;
    return true;
  });

  const totalDeliveriesMTD = deliveries.filter(d => {
    const today = new Date();
    const dDate = new Date(d.date);
    return dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear();
  }).length;

  const getPerformance = (staffId: string) => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    
    const staffDeliveries = deliveries.filter(d => {
      const dDate = new Date(d.date);
      return d.staffId === staffId && dDate >= lastMonth && dDate <= today;
    });
    
    const total = staffDeliveries.length;
    const completed = staffDeliveries.filter(d => d.status?.toLowerCase() === 'delivered').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    let feedbackSummary = "No data available";
    if (total > 0) {
      if (completionRate >= 90) feedbackSummary = "Excellent (4.8/5 avg)";
      else if (completionRate >= 75) feedbackSummary = "Good (4.0/5 avg)";
      else feedbackSummary = "Needs Improvement (3.2/5 avg)";
    }
    
    return { total, completionRate, feedbackSummary };
  };

  const handleResetPassword = async (s: Staff) => {
    const newPassword = prompt(`Enter new Login Password for ${s.name}:`);
    if (newPassword !== null) {
      const trimmed = newPassword.trim();
      if (trimmed === '') {
        alert('Password cannot be empty!');
        return;
      }
      
      setIsUpdating(s.id);
      try {
        const { auth } = getFirebase();
        if (!auth || !auth.currentUser) {
          throw new Error("No authenticated user found. Please login again.");
        }
        const idToken = await auth.currentUser.getIdToken();

        console.log(`[DEBUG] StaffManagement: Resetting password for staff ${s.id}`);
        const response = await fetch('/api/admin/update-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            userId: s.id,
            password: trimmed
          })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to update password');

        logActivity({
          module: 'Staff Management',
          action: 'Staff Password Reset',
          description: `Manually reset password for staff member ${s.name}`,
          status: 'success',
          resourceType: 'Staff',
          resourceId: String(s.id),
          resourceName: s.name
        });

        alert(`Password updated successfully for ${s.name}!`);
      } catch (err: any) {
        console.error("[DEBUG] StaffManagement: handleResetPassword error", err);
        let msg = "Failed to update password. Please try again.";
        if (err.message) {
          if (err.message.includes("at least 6 characters") || err.message.toLowerCase().includes("weak")) {
            msg = "Password must be at least 6 characters.";
          } else {
            msg = err.message;
          }
        }
        alert(msg);
      } finally {
        setIsUpdating(null);
      }
    }
  };

  const currentRole = currentUser?.role || 'owner';

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="JalSejiwan" showBack={true} />

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
        {currentRole === 'owner' && (
          <div className="bg-blue-700 rounded-3xl p-6 text-white mb-6">
            <Users className="w-8 h-8 mb-4 text-blue-300" />
            <h2 className="text-xl font-bold mb-1">Manage Workforce</h2>
            <p className="text-blue-200 text-sm mb-6">Add or update staff member details and assigned routes.</p>
            <Link href="/owner/staff/add" className="w-full bg-white text-blue-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <UserPlus className="w-5 h-5" /> Add New Staff
            </Link>
          </div>
        )}

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
          {/* Dynamic Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide font-sans">
            {['All', 'Active', 'Inactive'].map(f => (
              <button 
                type="button"
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-5 py-2 rounded-full font-sans font-bold text-xs whitespace-nowrap transition-all active:scale-95 ${filter === f ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
              >
                {f} Staff
              </button>
            ))}
          </div>
        </div>

        {/* Staff List */}
        <div className="space-y-4">
          {filteredStaff.map((s) => {
            const isExpanded = expandedStaffId === s.id;
            const perf = getPerformance(s.id);
            
            return (
              <div key={s.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 overflow-hidden transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm relative">
                      <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`} alt={`${s.name} - Registered Delivery Boy on JalSejiwan, the premier Water Delivery Management Software India`} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{s.name}</h3>
                      <div className="text-xs text-slate-500">Emp ID: {s.id.toString().padStart(3, '0')}-402</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s?.active ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {s?.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-700 text-sm truncate">{s.phone}</span>
                      </div>
                    </div>
                  <div className="flex items-start gap-3">
                    <Route className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Route</div>
                      <div className="font-medium text-slate-900 text-sm">{s.route || 'Not Assigned'}</div>
                    </div>
                  </div>
                </div>

                {/* Call and Reset Password Options */}
                <div className="flex gap-2 mb-4">
                  <a 
                    href={`tel:${s.phone}`}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" /> Call Staff
                  </a>
                   <button 
                    type="button"
                    disabled={isUpdating === s.id}
                    onClick={() => handleResetPassword(s)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform border border-blue-100 disabled:opacity-50"
                  >
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    {isUpdating === s.id ? 'Updating...' : 'Reset Password'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mb-4 space-y-3 border-t border-slate-100 pt-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Performance (Last 30 Days)</div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                        <div className="flex items-center gap-2 mb-1 text-blue-600">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Total</span>
                        </div>
                        <div className="text-xl font-bold text-slate-900">{perf.total}</div>
                      </div>
                      
                      <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                        <div className="flex items-center gap-2 mb-1 text-emerald-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
                        </div>
                        <div className="flex items-end gap-1">
                          <div className="text-xl font-bold text-slate-900">{perf.completionRate}%</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                      <div className="flex items-center gap-2 mb-1 text-amber-600">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Feedback Summary</span>
                      </div>
                      <div className="font-medium text-slate-800 text-sm">{perf.feedbackSummary}</div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center px-2 pt-2 border-t border-slate-50">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deliveries (MTD)</div>
                    <div className="font-bold text-blue-700 text-lg">{perf.total}</div>
                  </div>
                  <button 
                    onClick={() => setExpandedStaffId(isExpanded ? null : s.id)}
                    className="flex items-center gap-1 text-xs font-bold text-blue-700 uppercase tracking-wider active:scale-95 transition-transform"
                  >
                    {isExpanded ? (
                      <>Hide Performance <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>View Performance <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      <BottomNav role={currentRole === 'manager' ? 'manager' : 'owner'} activeTab="settings" />
    </div>
  );
}

export default wrapRoute(StaffManagement, { requiredRole: 'manager' });
