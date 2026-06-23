'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  const [filter, setFilter] = useState('All');
  const [isReminding, setIsReminding] = useState(false);
  const [progressCount, setProgressCount] = useState<number | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customerSearchHistory');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });
  const [userRole, setUserRole] = useState<'owner' | 'manager'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole');
      if (stored === 'owner' || stored === 'manager') return stored;
    }
    return 'owner';
  });

  const saveSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 3);
      localStorage.setItem('customerSearchHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectToggle = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCustomerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkReminder = async () => {
    if (selectedCustomerIds.length === 0) {
      alert('Please select at least one customer.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const countKey = `daily_reminder_count_${todayStr}`;
    const sentToday = parseInt(localStorage.getItem(countKey) || '0', 10);

    if (sentToday >= 100) {
      alert('You have reached your daily limit of 100 WhatsApp reminders today.');
      return;
    }

    const remainingToLimit = 100 - sentToday;
    if (selectedCustomerIds.length > remainingToLimit) {
      alert(`Daily remaining limit is ${remainingToLimit} reminders. Please select at most ${remainingToLimit} customers.`);
      return;
    }

    if (!confirm(`Send WhatsApp reminders to ${selectedCustomerIds.length} selected customers?`)) return;
    
    setIsReminding(true);
    setProgressCount(0);
    try {
      const { sendWhatsAppSummary } = await import('@/lib/reminderService');
      let successCount = 0;
      
      const selectedCustomers = customers.filter(c => selectedCustomerIds.includes(c.id));
      
      for (let i = 0; i < selectedCustomers.length; i++) {
        const customer = selectedCustomers[i];
        sendWhatsAppSummary(customer, businessInfo);
        setProgressCount(i + 1);
        successCount++;
        // Polite delay for browser window popping
        await new Promise(r => setTimeout(r, 600));
      }

      localStorage.setItem(countKey, String(sentToday + successCount));
      alert(`Process complete! Initiated reminders for ${successCount} customers.`);
      setSelectedCustomerIds([]);
    } catch (e) {
      console.error(e);
      alert('Failed during bulk reminder process.');
    } finally {
      setIsReminding(false);
      setProgressCount(null);
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

  const filteredCustomers = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return customers.filter(c => {
      const latestDelivery = deliveries.find(d => d.customerId === c.id && d.date === today);
      const isDelivered = latestDelivery?.status?.toLowerCase() === 'delivered';

      if (filter === 'Pending' && isDelivered) return false;
      if (filter === 'Done' && !isDelivered) return false;

      if (filter === 'Dues Only' && c.due === 0) return false;
      if (filter === 'Pending Empties' && c.emptyBalance === 0) return false;
      
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(query);
        const matchPhone = c.phone?.trim() && c.phone.includes(debouncedSearchQuery);
        const matchArea = c.area?.toLowerCase().includes(query);
        const matchRoute = c.route?.toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchArea && !matchRoute) return false;
      }
      
      return true;
    });
  }, [customers, deliveries, filter, debouncedSearchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="JalSejiwan" showBack={false} />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="max-w-md mx-auto px-4 py-6">
          {/* Search Bar */}
        <form onSubmit={(e) => { e.preventDefault(); saveSearch(searchQuery); setDebouncedSearchQuery(searchQuery); }} className="mb-6">
          {/* Quick Access Search History Component */}
          {searchHistory.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap text-xs font-sans">
              <span className="text-slate-500 font-bold">Recent:</span>
              {searchHistory.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSearchQuery(h);
                    setDebouncedSearchQuery(h);
                  }}
                  className="px-3 py-1 bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-full font-bold shadow-sm transition-all cursor-pointer active:scale-95 hover:border-slate-300"
                >
                  {h}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSearchHistory([]);
                  localStorage.removeItem('customerSearchHistory');
                }}
                className="text-red-500 hover:text-red-700 font-bold ml-auto px-2 py-1"
                aria-label="Clear search history"
              >
                Clear
              </button>
            </div>
          )}

          <div className="relative flex items-center">
            <Search className="absolute left-4 text-slate-400 w-5 h-5 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search name, phone, area, route" 
              className="w-full pl-12 pr-12 py-4 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-500 font-medium font-sans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => saveSearch(searchQuery)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveSearch(searchQuery);
                }
              }}
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

        {filter === 'Dues Only' && filteredCustomers.length > 0 && userRole === 'owner' && (
          <div className="mb-4 space-y-3">
            {/* Select All / Deselect All Controls */}
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold px-1">
              <span>Selected: {selectedCustomerIds.length} / {filteredCustomers.length}</span>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setSelectedCustomerIds(filteredCustomers.map(c => c.id))}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button 
                  type="button" 
                  onClick={() => setSelectedCustomerIds([])}
                  className="text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {progressCount !== null && (
              <div className="bg-orange-50 border border-orange-200 text-orange-850 text-xs py-2.5 px-3 rounded-xl font-bold flex justify-between items-center animate-pulse">
                <span>Sending Progress...</span>
                <span>{progressCount} / {selectedCustomerIds.length} Processed</span>
              </div>
            )}

            <button 
              onClick={handleBulkReminder}
              disabled={isReminding}
              className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm border border-orange-300 disabled:opacity-50"
            >
              <Bell className="w-5 h-5 text-orange-600" />
              {isReminding ? `Sending Reminders (${progressCount !== null ? progressCount : 0}/${selectedCustomerIds.length})...` : '🔔 Remind Selected Customers'}
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
                  <div className="flex items-start gap-3">
                    {filter === 'Dues Only' && userRole === 'owner' && (
                      <button
                        onClick={(e) => handleSelectToggle(customer.id, e)}
                        className="mt-1 flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-full"
                        aria-label={`Toggle selection for ${customer.name}`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedCustomerIds.includes(customer.id) 
                            ? 'bg-blue-600 border-blue-600 text-white animate-scaleIn' 
                            : 'border-slate-300 hover:border-slate-400 bg-white'
                        }`}>
                          {selectedCustomerIds.includes(customer.id) && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 truncate">{customer.name}</h3>
                          <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                            <MapPin className="w-3 h-3" />
                            {customer.address}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                </div> {/* Closes flex-1 min-w-0 */}
              </div> {/* Closes flex items-start gap-3 */}
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
