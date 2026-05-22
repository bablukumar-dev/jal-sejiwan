'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import { Search, Calendar, Download, Plus, Wallet, QrCode, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAppContext } from '@/app/context/AppContext';

export default function PaymentsList() {
  const { payments, customers, businessInfo } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('Today');

  const today = new Date().toISOString().split('T')[0];
  const yz = new Date();
  yz.setDate(yz.getDate() - 1);
  const yesterday = yz.toISOString().split('T')[0];

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    window.location.reload();
  };

  const filteredPayments = payments.filter(p => {
    const customer = customers.find(c => c.id === p.customerId);
    if (searchQuery && customer) {
      const query = searchQuery.toLowerCase();
      const matchName = customer.name?.toLowerCase().includes(query);
      const matchPhone = customer.phone?.includes(searchQuery);
      if (!matchName && !matchPhone) return false;
    }
    
    if (filter === 'Today' && p.date !== today) return false;
    if (filter === 'Yesterday' && p.date !== yesterday) return false;
    if (filter === 'Cash Only' && p.mode !== 'Cash') return false;
    if (filter === 'UPI Only' && p.mode !== 'UPI') return false;
    
    return true;
  });

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const upiCount = filteredPayments.filter(p => p.mode === 'UPI').length;
  const cashInHand = filteredPayments.filter(p => p.mode === 'Cash').reduce((sum, p) => sum + p.amount, 0);
  const pendingDues = customers.reduce((sum, c) => sum + c.due, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Jal Sejiwan" showBack={true} />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="max-w-md mx-auto px-4 py-6">
          {/* Search Bar */}
        <div className="mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by customer..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex gap-2 mb-6">
          <button className="flex-1 bg-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Calendar className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider">Date Range</span>
          </button>
          <button className="w-12 bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center active:scale-95 transition-transform">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
          {['Today', 'Yesterday', 'Cash Only', 'UPI Only', 'All'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
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
            <button className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
              Export CSV
            </button>
          </div>

          <div className="space-y-3">
            {filteredPayments.length === 0 ? (
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
              filteredPayments.map(payment => {
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
                             const { doc, receiptNo } = generatePaymentReceiptPDF(payment, businessInfo);
                             doc.save(`Receipt_${customer.name}_${payment.date}.pdf`);
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
                             const { doc, receiptNo } = generatePaymentReceiptPDF(payment, businessInfo);
                             const pdfBlob = doc.output('blob');
                             await sendPaymentReceiptWhatsApp(payment, customer, businessInfo, receiptNo, pdfBlob);
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

      <BottomNav role="owner" activeTab="payments" />
    </div>
  );
}
