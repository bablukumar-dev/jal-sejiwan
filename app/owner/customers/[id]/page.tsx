'use client';

import { useState } from 'react';
import Image from 'next/image';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Phone, Truck, Wallet, Droplet, ArrowLeftRight, AlertTriangle, ArrowRight, Edit, FileText, Share2, Bell, MessageCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
import { sendWhatsAppSummary } from '@/lib/reminderService';
import { updateCustomer, batchAddDeliveries } from '@/lib/firestore-service';
import { setCookie } from '@/lib/authHelper';
import { getUniqueId } from '@/lib/utils';

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const { customers, deliveries, payments, setCustomers, setDeliveries, staff, businessInfo, currentUser } = useAppContext();
  const [isDelivering, setIsDelivering] = useState(false);
  
  const customerId = params.id as string;
  const customer = customers.find(c => c.id === customerId);
  
  const [activeTab, setActiveTab] = useState('Ledger');
  const [notes, setNotes] = useState(customer?.notes || '');
  const userRole = currentUser?.role || 'owner';

  if (!customer) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Customer not found</div>;
  }

  const customerDeliveries = deliveries.filter(d => d.customerId === customerId);
  const customerPayments = payments.filter(p => p.customerId === customerId);

  const ledger = [
    ...customerDeliveries.map(d => ({ ...d, type: 'delivery', dateObj: new Date(d.date) })),
    ...customerPayments.map(p => ({ ...p, type: 'payment', dateObj: new Date(p.date) }))
  ].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  const handleSaveNotes = async () => {
    try {
      if (!currentUser) return;
      await updateCustomer(customerId, { notes }, currentUser);
      alert('Notes saved');
    } catch (e) {
      console.error("Failed to save notes", e);
    }
  };

  const handleSendWhatsAppSummary = async () => {
    try {
      if (!customer) {
        alert('Customer data is not available.');
        return;
      }
      const phone = customer.phone || '';
      if (!phone.replace(/\D/g, '')) {
        alert('Invalid phone');
        return;
      }
      sendWhatsAppSummary(customer, businessInfo);
    } catch (e) {
      console.error(e);
      alert('Failed to send WhatsApp summary');
    }
  };

  const handleGenerateBill = async () => {
    try {
      if (!customer) {
        alert('Customer data is not available.');
        return;
      }
      const { generateInvoicePDF } = await import('@/lib/pdfGenerator');
      const { doc } = await generateInvoicePDF(customer, customerDeliveries, customerPayments, businessInfo);
      if (!doc) {
        throw new Error('Could not instantiate PDF document.');
      }
      
      // Save locally
      doc.save(`Invoice_${customer.name}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`);
      
      alert('PDF generated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF');
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      if (!customer) {
        alert('Customer data is not available.');
        return;
      }
      const phone = customer.phone || '';
      if (!phone.replace(/\D/g, '')) {
        alert('Invalid phone');
        return;
      }
      const { generateInvoicePDF } = await import('@/lib/pdfGenerator');
      const { shareInvoiceViaWhatsApp } = await import('@/lib/whatsappUtils');
      const { doc, invoiceNo } = await generateInvoicePDF(customer, customerDeliveries, customerPayments, businessInfo);
      
      if (!doc) {
        throw new Error('Could not generate PDF invoice.');
      }
      // Get Blob
      const pdfBlob = doc.output('blob');
      
      await shareInvoiceViaWhatsApp(customer, businessInfo, invoiceNo, pdfBlob);
    } catch (e) {
      console.error(e);
      alert('Failed to share to WhatsApp');
    }
  };
  
  const handleSendReminder = async () => {
    try {
      if (!customer) {
        alert('Customer data is not available.');
        return;
      }
      const phone = customer.phone || '';
      if (!phone.replace(/\D/g, '')) {
        alert('Invalid phone');
        return;
      }
      const { sendReminderWhatsApp } = await import('@/lib/whatsappUtils');
      sendReminderWhatsApp(customer, businessInfo);
    } catch (e) {
      console.error(e);
      alert('Failed to send reminder');
    }
  };

  const handleDeliverWater = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Deliver button clicked");
    console.log("currentUser:", currentUser);
    console.log("customer:", customer);
    console.log("pathname:", window.location.pathname);

    if (isDelivering) return; 
    setIsDelivering(true);
    
    console.log("HandleDeliverWater called for customer:", customer?.id);
    if (!currentUser) {
      console.error("No current user");
      alert("Please login");
      setIsDelivering(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = deliveries.find(d => d.customerId === customer?.id && d.date === today);
    console.log("Existing delivery found:", existing);

    try {
      if (existing) {
        console.log("Routing to existing delivery:", `/staff/delivery/${existing.id}`);
        setCookie('userRole', currentUser.role, 3600 * 24 * 30);
        router.push(`/staff/delivery/${existing.id}`);
      } else {
        console.log("Creating new delivery for:", customer?.id);
        const currentStaffId = currentUser.uid;
        const currentStaffName = currentUser.name || 'Owner/Manager';

        const newDelivery = {
          id: getUniqueId(),
          customerId: customer?.id,
          customerName: customer?.name || '',
          date: today,
          status: 'Pending',
          staffId: currentStaffId,
          staffName: currentStaffName,
          deliveredQty: 0,
          returnedEmpty: 0,
          paymentReceived: false,
          paymentAmount: 0,
          paymentMode: 'Cash',
          note: ''
        };

        console.log("Creating new delivery:", newDelivery);
        const ids = await batchAddDeliveries([newDelivery], currentUser);
        console.log("New delivery created with IDs:", ids);
        if (ids && ids.length > 0) {
          setCookie('userRole', currentUser.role, 3600 * 24 * 30);
          console.log("Navigating to:", `/staff/delivery/${ids[0]}`);
          router.push(`/staff/delivery/${ids[0]}`);
        }
      }
    } catch (e: any) {
      console.error("Failed to create delivery", e);
      console.error(e.stack);
      alert("Failed to create delivery: " + e);
    } finally {
      setIsDelivering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="JalSejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 border-2 border-emerald-500 overflow-hidden flex-shrink-0 relative">
            {customer.imageURL ? (
              <Image 
                src={customer.imageURL} 
                alt={customer.name} 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Image 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.name}`} 
                alt={`${customer.name} - Active Client profile`} 
                fill 
                className="object-cover" 
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Profile</div>
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
        <div className={`grid ${['owner', 'manager', 'staff'].includes(userRole) ? 'grid-cols-4 gap-2' : 'grid-cols-3 gap-3'} mb-6`}>
          <Link href={`/owner/customers/edit/${customer.id}`} className="bg-slate-100 text-slate-700 rounded-xl py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <Edit className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
          </Link>
          <div className="flex bg-slate-100 rounded-xl col-span-1">
            <button 
              onClick={() => window.location.href = `tel:${customer.phone}`}
              className="flex-1 text-slate-700 py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <Phone className="w-5 h-5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Call</span>
            </button>
            <div className="w-[1px] bg-slate-200 my-2"></div>
            <button 
              onClick={handleSendWhatsAppSummary}
              className="flex-1 text-slate-700 py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">WA</span>
            </button>
          </div>
          <Link href="/owner/payments/record" className="bg-orange-700 text-white rounded-xl py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pay</span>
          </Link>
          {['owner', 'manager', 'staff'].includes(userRole) && (
            <button 
              onClick={handleDeliverWater}
              disabled={isDelivering}
              aria-label="Deliver water"
              className={`bg-blue-600 text-white rounded-xl py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${isDelivering ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Truck className="w-5 h-5 text-white" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight">
                {isDelivering ? 'Processing...' : 'Deliver Water'}
              </span>
            </button>
          )}
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
        <div className="bg-blue-100 rounded-2xl p-5 border border-blue-200 mb-4">
          <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Empty Cans With Customer</div>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-blue-950">{customer.emptyBalance.toString().padStart(2, '0')}</span>
            <Droplet className="w-6 h-6 text-blue-600 fill-current" />
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200/50 text-sm font-medium text-blue-800">
            Last Delivery: {customer.lastDelivery || 'N/A'}
          </div>
        </div>

        {/* Enterprise SaaS Info */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 mb-6 space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Security Deposit</div>
              <div className="font-medium text-slate-900">₹{customer.deposit || 0}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Wallet Balance</div>
               <div className="font-medium text-slate-900 line-clamp-1">{customer.walletBalance || 0}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subscription Plan</div>
              <div className="font-medium text-slate-900">{customer.subscriptionPlan || 'None'}</div>
            </div>
             <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Risk Level</div>
              <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${customer.riskLevel === 'High' ? 'bg-red-100 text-red-700' : customer.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                 {customer.riskLevel || 'Low'}
              </div>
            </div>
        </div>

        {/* Invoice Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button onClick={() => handleGenerateBill()} className="bg-emerald-100 text-emerald-700 rounded-xl py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform border border-emerald-200">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">PDF Bill</span>
          </button>
          <button onClick={() => handleShareWhatsApp()} className="bg-green-100 text-green-700 rounded-xl py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform border border-green-200">
            <Share2 className="w-5 h-5 text-green-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">WhatsApp</span>
          </button>
          <button onClick={() => handleSendReminder()} className="bg-orange-100 text-orange-700 rounded-xl py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform border border-orange-200">
            <Bell className="w-5 h-5 text-orange-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">Remind</span>
          </button>
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
          {activeTab === 'Ledger' && (
            <div className="mb-4">
              <button 
                onClick={handleGenerateBill}
                className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"
              >
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Download Full Ledger Report (PDF)</span>
              </button>
            </div>
          )}
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

      <BottomNav role={userRole} activeTab="customers" />
    </div>
  );
}
