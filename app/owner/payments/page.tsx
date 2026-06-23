'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import { Search, Calendar, Download, Plus, Wallet, QrCode, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import { wrapRoute } from '@/lib/permissionGuard';

function PaymentsList() {
  const { payments, customers, businessInfo } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('paymentsSearchHistory');
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
  const [userRole, setUserRole] = useState<'owner' | 'manager' | 'staff'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole');
      if (stored === 'owner' || stored === 'manager' || stored === 'staff') return stored;
    }
    return 'owner';
  });
  const [filter, setFilter] = useState('Today');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const saveSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 3);
      localStorage.setItem('paymentsSearchHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const yz = new Date();
  yz.setDate(yz.getDate() - 1);
  const yesterday = yz.toISOString().split('T')[0];

  // Helper date variables for presets
  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);
  const sevenDaysAgo = sevenDaysAgoDate.toISOString().split('T')[0];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    window.location.reload();
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const customer = customers.find(c => c.id === p.customerId);
      
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchMode = p.mode?.toLowerCase().includes(query);
        const matchAmount = p.amount?.toString().includes(query);
        
        let matchCustomer = false;
        if (customer) {
          const matchName = customer.name?.toLowerCase().includes(query);
          const matchPhone = customer.phone?.toLowerCase().includes(query);
          const matchArea = customer.area?.toLowerCase().includes(query);
          const matchRoute = customer.route?.toLowerCase().includes(query);
          matchCustomer = !!(matchName || matchPhone || matchArea || matchRoute);
        }
        
        if (!matchMode && !matchAmount && !matchCustomer) return false;
      }
      
      if (filter === 'Today' && p.date !== today) return false;
      if (filter === 'Yesterday' && p.date !== yesterday) return false;
      if (filter === 'Last 7 Days' && (p.date < sevenDaysAgo || p.date > today)) return false;
      if (filter === 'This Month' && (p.date < startOfMonth || p.date > today)) return false;
      if (filter === 'Cash Only' && p.mode !== 'Cash') return false;
      if (filter === 'UPI Only' && p.mode !== 'UPI') return false;
      if (filter === 'Custom Range') {
        if (startDate && p.date < startDate) return false;
        if (endDate && p.date > endDate) return false;
      }
      
      return true;
    });
  }, [payments, customers, debouncedSearchQuery, filter, today, yesterday, sevenDaysAgo, startOfMonth, startDate, endDate]);

  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'amt-high') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amt-low') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [filteredPayments, sortBy]);

  const totalCollected = useMemo(() => filteredPayments.reduce((sum, p) => sum + p.amount, 0), [filteredPayments]);
  const upiCount = useMemo(() => filteredPayments.filter(p => p.mode === 'UPI').length, [filteredPayments]);
  const cashInHand = useMemo(() => filteredPayments.filter(p => p.mode === 'Cash').reduce((sum, p) => sum + p.amount, 0), [filteredPayments]);
  const pendingDues = useMemo(() => customers.reduce((sum, c) => sum + c.due, 0), [customers]);

  const handleExportCSV = () => {
    if (sortedPayments.length === 0) {
      alert("No collections available to export.");
      return;
    }
    const headers = ["Payment ID", "Customer Name", "Date", "Amount (Rs)", "Mode"];
    const rows = sortedPayments.map(p => {
      const customerName = customers.find(c => c.id === p.customerId)?.name || "Unknown";
      return [p.id, `"${customerName.replace(/"/g, '""')}"`, p.date, p.amount, p.mode];
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Recent_Collections_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="JalSejiwan" showBack={true} />

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
                  localStorage.removeItem('paymentsSearchHistory');
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
              placeholder="Search by customer..." 
              className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-500 font-medium"
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
                className="absolute right-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Date Filter */}
        <div className="flex gap-2 mb-6 font-sans">
          <button 
            type="button"
            onClick={() => {
              setShowCustomDateRange(!showCustomDateRange);
              setShowFilterPanel(false);
            }}
            className={`flex-1 font-sans font-bold py-3 text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all ${showCustomDateRange || filter === 'Custom Range' || filter === 'Last 7 Days' || filter === 'This Month' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider text-ellipsis overflow-hidden whitespace-nowrap max-w-[200px]">
              {filter === 'Custom Range' && startDate && endDate 
                ? `${startDate} to ${endDate}` 
                : filter === 'Last 7 Days'
                ? 'Last 7 Days'
                : filter === 'This Month'
                ? 'This Month'
                : 'Date Range'}
            </span>
          </button>
          <button 
            type="button"
            onClick={() => {
              setShowFilterPanel(!showFilterPanel);
              setShowCustomDateRange(false);
            }}
            className={`w-12 rounded-xl flex items-center justify-center active:scale-95 transition-all ${showFilterPanel ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Date Range Picker Component */}
        {showCustomDateRange && (
          <div className="overflow-hidden mb-6 transition-all duration-300 animate-in fade-in slide-in-from-top-4 font-sans">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Custom Date Range</div>
              
              {/* Presets in Date Range Picker */}
              <div className="grid grid-cols-2 gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(sevenDaysAgo);
                    setEndDate(today);
                    setFilter('Last 7 Days');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors text-center ${filter === 'Last 7 Days' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(startOfMonth);
                    setEndDate(today);
                    setFilter('This Month');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors text-center ${filter === 'This Month' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                >
                  This Month
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">From</label>
                  <input 
                    type="date"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setFilter('Custom Range');
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">To</label>
                  <input 
                    type="date"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setFilter('Custom Range');
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-100 mt-2">
                {(startDate || endDate) && (
                  <button 
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setFilter('Today');
                    }}
                    className="text-xs text-red-600 font-bold hover:underline"
                  >
                    Clear Dates
                  </button>
                )}
                <button 
                  onClick={() => setShowCustomDateRange(false)}
                  className="ml-auto bg-slate-900 text-white font-bold py-1.5 px-4 rounded-lg text-xs hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sort Panel */}
        {showFilterPanel && (
          <div className="overflow-hidden mb-6 transition-all duration-300 animate-in fade-in slide-in-from-top-4 font-sans">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort & Extra Options</div>
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Sort Collections By</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'newest', label: 'Newest First' },
                    { id: 'oldest', label: 'Oldest First' },
                    { id: 'amt-high', label: 'Amount: High to Low' },
                    { id: 'amt-low', label: 'Amount: Low to High' },
                  ].map(opt => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setSortBy(opt.id || 'newest')}
                      className={`px-3 py-2 rounded-lg text-left text-xs font-bold border transition-colors ${sortBy === opt.id ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-1 border-t border-slate-100 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowFilterPanel(false)}
                  className="bg-slate-900 text-white font-bold py-1.5 px-4 rounded-lg text-xs hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2 font-sans">
          {['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Cash Only', 'UPI Only', 'All', ...(filter === 'Custom Range' ? ['Custom Range'] : [])].map(f => (
            <button 
              key={f}
              onClick={() => {
                setFilter(f);
                if (f === 'Last 7 Days') {
                  setStartDate(sevenDaysAgo);
                  setEndDate(today);
                } else if (f === 'This Month') {
                  setStartDate(startOfMonth);
                  setEndDate(today);
                } else if (f !== 'Custom Range') {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              className={`px-6 py-2 rounded-full font-sans font-bold text-sm whitespace-nowrap transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-blue-600">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Collected</div>
            <div className="text-2xl font-bold text-slate-900">₹{totalCollected}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-slate-300">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">UPI Transactions</div>
            <div className="text-2xl font-bold text-slate-900">{upiCount}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-orange-600">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cash In Hand</div>
            <div className="text-2xl font-bold text-slate-900">₹{cashInHand}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-red-600">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Dues</div>
            <div className="text-2xl font-bold text-slate-900">₹{pendingDues}</div>
          </div>
        </div>

        {/* Recent Collections */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Collections</h2>
            <button 
              type="button"
              onClick={handleExportCSV}
              className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-transform"
            >
              Export CSV
            </button>
          </div>

          <div className="space-y-3">
            {sortedPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-slate-100">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                  <Wallet className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">No collections yet</h3>
                <p className="text-sm text-slate-500 max-w-[200px]">
                  No payments found for the selected view.
                </p>
              </div>
            ) : (
              sortedPayments.map(payment => {
                const customer = customers.find(c => c.id === payment.customerId);
                if (!customer) return null;

                return (
                  <div key={payment.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${payment.mode === 'UPI' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                        {payment.mode === 'UPI' ? <QrCode className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{customer.name}</h3>
                        <div className="text-xs text-slate-500 mt-1">{payment.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-700 text-lg">+ ₹ {payment.amount}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 flex items-center justify-end gap-1">
                          {payment.mode} <span className={`w-1.5 h-1.5 rounded-full ${payment.mode === 'UPI' ? 'bg-blue-600' : 'bg-orange-600'}`}></span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Add Bill Generation button here */}
                    <div className="flex border-t border-slate-100 pt-2 gap-2 mt-1">
                      <button 
                         onClick={async () => {
                           try {
                             const { generatePaymentReceiptPDF } = await import('@/lib/pdfGenerator');
                             const { doc, receiptNo } = await generatePaymentReceiptPDF(payment, businessInfo);
                             if (doc) {
                               doc.save(`Receipt_${customer.name}_${payment.date}.pdf`);
                             } else {
                               throw new Error('Could not instantiate PDF document.');
                             }
                           } catch (e) {
                             console.error(e);
                             alert('Failed to generate Receipt');
                           }
                         }}
                         className="flex-1 text-[10px] font-bold uppercase py-2 bg-emerald-50 text-emerald-700 rounded-lg"
                      >
                        Download Receipt
                      </button>
                      <button
                         onClick={async () => {
                           try {
                             const { generatePaymentReceiptPDF } = await import('@/lib/pdfGenerator');
                             const { sendPaymentReceiptWhatsApp } = await import('@/lib/whatsappUtils');
                             const { doc, receiptNo } = await generatePaymentReceiptPDF(payment, businessInfo);
                             if (doc) {
                               const pdfBlob = doc.output('blob');
                               await sendPaymentReceiptWhatsApp(payment, customer, businessInfo, receiptNo, pdfBlob);
                             } else {
                               throw new Error('Could not instantiate PDF document.');
                             }
                           } catch (e) {
                             console.error(e);
                             alert('Failed to share to WhatsApp');
                           }
                         }}
                         className="flex-1 text-[10px] font-bold uppercase py-2 bg-green-50 text-green-700 rounded-lg"
                      >
                        Share Receipt
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
      </PullToRefresh>

      {/* FAB */}
      <Link href="/owner/payments/record" className="fixed bottom-24 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 z-40 active:scale-90 duration-200 flex items-center gap-2">
        <Plus className="w-6 h-6" />
        <span className="font-bold text-sm uppercase pr-2">New Collection</span>
      </Link>

      <BottomNav role={userRole} activeTab="payments" />
    </div>
  );
}

export default wrapRoute(PaymentsList, { requiredRole: 'manager' });
