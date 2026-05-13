'use client';

import { useState } from 'react';
import Image from 'next/image';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Phone, Truck, Wallet, Droplet, ArrowLeftRight, AlertTriangle, ArrowRight, Edit, FileText } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const { customers, deliveries, payments, setCustomers } = useAppContext();
  
  const customerId = parseInt(params.id as string);
  const customer = customers.find(c => c.id === customerId);
  
  const [activeTab, setActiveTab] = useState('Ledger');
  const [notes, setNotes] = useState(customer?.notes || '');

  if (!customer) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Customer not found</div>;
  }

  const customerDeliveries = deliveries.filter(d => d.customerId === customerId);
  const customerPayments = payments.filter(p => p.customerId === customerId);

  const ledger = [
    ...customerDeliveries.map(d => ({ ...d, type: 'delivery', dateObj: new Date(d.date) })),
    ...customerPayments.map(p => ({ ...p, type: 'payment', dateObj: new Date(p.date) }))
  ].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  const handleSaveNotes = () => {
    setCustomers(customers.map(c => c.id === customerId ? { ...c, notes } : c));
    alert('Notes saved');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Jal Sejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 border-2 border-emerald-500 overflow-hidden flex-shrink-0 relative">
            <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.name}`} alt="avatar" fill className="object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Profile</div>
              <Link href={`/owner/customers/edit/${customer.id}`} className="text-blue-600 p-1">
                <Edit className="w-4 h-4" />
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{customer.name}</h1>
            <div className="flex items-center gap-1 text-slate-600 mt-1">
              <Phone className="w-3 h-3" />
              <span className="font-medium">{customer.phone}</span>
            </div>
            <div className="text-sm text-slate-500 mt-1">{customer.address}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button 
            onClick={() => window.location.href = `tel:${customer.phone}`}
            className="bg-slate-100 text-slate-700 rounded-xl py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
          >
            <Phone className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Call</span>
          </button>
          <Link href={`/staff/delivery/${customer.id}`} className="bg-blue-600 text-white rounded-xl py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <Truck className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Record</span>
          </Link>
          <Link href="/owner/payments/record" className="bg-orange-700 text-white rounded-xl py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pay</span>
          </Link>
        </div>

        {/* Dues Card */}
        <div className="bg-orange-100 rounded-2xl p-5 border border-orange-200 mb-4">
          <div className="text-xs font-bold text-orange-900 uppercase tracking-wider mb-1">Total Dues</div>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-orange-950">₹{customer.due}</span>
            {customer.due > 0 && <AlertTriangle className="w-6 h-6 text-orange-600" />}
          </div>
        </div>

        {/* Empties Card */}
        <div className="bg-blue-100 rounded-2xl p-5 border border-blue-200 mb-6">
          <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Empty Cans With Customer</div>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-blue-950">{customer.emptyBalance.toString().padStart(2, '0')}</span>
            <Droplet className="w-6 h-6 text-blue-600 fill-current" />
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200/50 text-sm font-medium text-blue-800">
            Last Delivery: {customer.lastDelivery || 'N/A'}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2 border-b border-slate-200">
          {['Ledger', 'Deliveries', 'Payments', 'Notes'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-bold text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-3">
          {activeTab === 'Ledger' && ledger.map((item, i) => (
            <div key={i} className={`bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-4 ${(item as any).status === 'Skipped' ? 'opacity-80' : ''}`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'delivery' ? ((item as any).status === 'Skipped' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600') : 'bg-orange-100 text-orange-600'}`}>
                {item.type === 'delivery' ? <Truck className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${(item as any).status === 'Skipped' ? 'text-red-900' : 'text-slate-900'}`}>
                  {item.type === 'delivery' ? ((item as any).status === 'Skipped' ? `Skipped: ${(item as any).skipReason || (item as any).note}` : `Delivery: ${(item as any).deliveredQty} Cans`) : 'Payment Received'}
                </h4>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{item.date}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${item.type === 'delivery' ? 'text-slate-900' : 'text-orange-700'}`}>
                  {item.type === 'delivery' ? ((item as any).status === 'Skipped' ? '' : `₹${(item as any).paymentAmount || 0}`) : `₹${(item as any).amount}`}
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase mt-1 ${item.type === 'delivery' ? ((item as any).status === 'Skipped' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50') : 'text-orange-700 bg-orange-50'}`}>
                  {item.type === 'delivery' ? (item as any).status : (item as any).mode}
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'Deliveries' && customerDeliveries.map((d, i) => (
            <div key={i} className={`bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-4 ${d.status === 'Skipped' ? 'opacity-80' : ''}`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${d.status === 'Skipped' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${d.status === 'Skipped' ? 'text-red-900' : 'text-slate-900'}`}>
                  {d.status === 'Skipped' ? `Skipped: ${d.skipReason || d.note}` : `Delivery: ${d.deliveredQty} Cans`}
                </h4>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{d.date}</div>
              </div>
              <div className="text-right">
                {d.status !== 'Skipped' && <div className="font-bold text-slate-900">₹{d.paymentAmount || 0}</div>}
                <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase mt-1 ${d.status === 'Skipped' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'}`}>{d.status}</div>
              </div>
            </div>
          ))}

          {activeTab === 'Payments' && customerPayments.map((p, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900">Payment Received</h4>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{p.date}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-orange-700">₹{p.amount}</div>
                <div className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded uppercase mt-1">{p.mode}</div>
              </div>
            </div>
          ))}

          {activeTab === 'Notes' && (
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <textarea 
                className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 resize-none mb-3"
                rows={4}
                placeholder="Add notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <button 
                onClick={handleSaveNotes}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg active:scale-95 transition-transform"
              >
                Save Notes
              </button>
            </div>
          )}
        </div>

      </main>

      <BottomNav role="owner" activeTab="customers" />
    </div>
  );
}
