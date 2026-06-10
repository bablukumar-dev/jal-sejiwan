'use client';

import { useState } from 'react';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import { Search, MapPin, Phone, Plus, ChevronDown, Users, Bell, MessageCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
import { sendReminderWhatsApp } from '@/lib/whatsappUtils';
import { wrapRoute } from '@/lib/permissionGuard';

function CustomersList() {
  const { customers, deliveries = [], businessInfo } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [isReminding, setIsReminding] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'manager'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole');
      if (stored === 'owner' || stored === 'manager') return stored;
    }
    return 'owner';
  });

  const handleBulkReminder = async () => {
    if (!confirm('Send Bulk WhatsApp reminder to all due customers?')) return;
    setIsReminding(true);
    try {
      const { runBulkReminder } = await import('@/lib/reminderService');
      const result = await runBulkReminder(customers, businessInfo);
      if (result.success) {
        alert(`Successfully sent ${result.count} reminders!`);
      } else {
        alert('Failed during bulk reminder process.');
      }
    } catch (e) {
      console.error(e);
      alert('Error sharing bulk reminder');
    } finally {
      setIsReminding(false);
    }
  };

  const handleRefresh = async () => {
    // Simulate network delay for data refresh
    await new Promise(resolve => setTimeout(resolve, 800));
    // In a real app we would call fetch APIs here, since we use local state, 
    // we can either optionally reload the window or just let it finish.
    // For full re-sync we can reload:
    window.location.reload();
  };

  const filteredCustomers = customers.filter(c => {
    const today = new Date().toISOString().split('T')[0];
    const latestDelivery = deliveries.find(d => d.customerId === c.id && d.date === today);
    const isDelivered = latestDelivery?.status?.toLowerCase() === 'delivered';

    if (filter === 'Pending' && isDelivered) return false;
    if (filter === 'Done' && !isDelivered) return false;

    if (filter === 'Dues Only' && c.due === 0) return false;
    if (filter === 'Pending Empties' && c.emptyBalance === 0) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(query);
      const matchPhone = c.phone?.includes(searchQuery);
      const matchArea = c.area?.toLowerCase().includes(query);
      const matchRoute = c.route?.toLowerCase().includes(query);
      if (!matchName && !matchPhone && !matchArea && !matchRoute) return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="JalSejiwan" showBack={false} />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="max-w-md mx-auto px-4 py-6">
          {/* Search Bar */}
        <form onSubmit={(e) => { e.preventDefault(); }} className="mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-slate-400 w-5 h-5 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search name, phone, area, route" 
              className="w-full pl-12 pr-12 py-4 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-500 font-medium font-sans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
          <button 
            onClick={() => setFilter('All')}
            className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${filter === 'All' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('Pending')}
            className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${filter === 'Pending' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('Done')}
            className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${filter === 'Done' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            Done
          </button>
          <button 
            onClick={() => setFilter('Dues Only')}
            className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${filter === 'Dues Only' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            Dues Only
          </button>
          <button 
            onClick={() => setFilter('Pending Empties')}
            className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${filter === 'Pending Empties' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            Pending Empties
          </button>
        </div>

        {filter === 'Dues Only' && filteredCustomers.length > 0 && (userRole === 'owner' || userRole === 'manager') && (
          <div className="mb-4">
            <button 
              onClick={handleBulkReminder}
              disabled={isReminding}
              className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm border border-orange-300 disabled:opacity-50"
            >
              <Bell className="w-5 h-5 text-orange-600" />
              {isReminding ? 'Sending Reminders...' : '🔔 Remind All Due Customers'}
            </button>
          </div>
        )}

        {/* Customer List */}
        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No customers yet</h3>
              <p className="text-slate-500 mb-6 max-w-[250px]">
                {searchQuery ? "We couldn't find any customers matching your search." : "Start by adding your first customer"}
              </p>
              {!searchQuery && (
                <Link href="/owner/customers/add" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform">
                  <Plus className="w-5 h-5" /> Add First Customer
                </Link>
              )}
            </div>
          ) : (
            filteredCustomers.map(customer => {
              const today = new Date().toISOString().split('T')[0];
              const latestDelivery = deliveries.find(d => d.customerId === customer.id && d.date === today);
              const isDelivered = latestDelivery?.status?.toLowerCase() === 'delivered';

              return (
                <Link href={`/owner/customers/${customer.id}`} key={customer.id} className="block bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{customer.name}</h3>
                      <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                        <MapPin className="w-3 h-3" />
                        {customer.address}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          sendReminderWhatsApp(customer, businessInfo);
                        }}
                        className="p-3 bg-green-50 text-green-600 rounded-full active:scale-90 transition-transform"
                      >
                        <MessageCircle className="w-5 h-5 fill-current" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `tel:${customer.phone}`;
                        }}
                        className="p-3 bg-blue-50 text-blue-600 rounded-full active:scale-90 transition-transform"
                      >
                        <Phone className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isDelivered ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-[10px] font-bold uppercase tracking-tight border border-green-200">
                        ✅ Delivered
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-tight border border-amber-200">
                        ⏳ Pending
                      </span>
                    )}
                    {customer.due > 0 ? (
                      <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-tight border border-orange-200">
                        Due ₹{customer.due}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-tight">
                        Paid
                      </span>
                    )}
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-[10px] font-bold uppercase tracking-tight">
                      Empties {customer.emptyBalance}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-tight">
                      {customer.type}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>
      </PullToRefresh>

      {/* FAB */}
      <Link href="/owner/customers/add" className="fixed bottom-24 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 z-40 active:scale-90 duration-200 flex items-center gap-2">
        <Plus className="w-6 h-6" />
        <span className="font-bold text-sm uppercase pr-2">Add New Customer</span>
      </Link>

      <BottomNav role={userRole} activeTab="customers" />
    </div>
  );
}

export default wrapRoute(CustomersList, { requiredRole: 'manager' });
