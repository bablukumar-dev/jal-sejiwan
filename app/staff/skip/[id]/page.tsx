'use client';

import TopAppBar from '@/components/TopAppBar';
import { MapPin, Lock, PackageMinus, Plane, MoreHorizontal, FileText, Ban } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useState } from 'react';
import { logActivity } from '@/lib/activityLogger';

export default function SkipDelivery() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = params.id as string;
  const { deliveries, customers, setDeliveries } = useAppContext();

  const delivery = deliveries.find(d => d.id === deliveryId);
  const customer = customers.find(c => c.id === delivery?.customerId);

  const [reason, setReason] = useState('Door Locked');
  const [remarks, setRemarks] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (!delivery || !customer) {
    return <div className="p-4">Loading...</div>;
  }

  const handleSkip = () => {
    try {
        const updatedDeliveries = deliveries.map(d => 
        d.id === deliveryId ? { ...d, status: 'Skipped' as const, skipReason: reason, skipRemarks: remarks } : d
        );
        setDeliveries(updatedDeliveries);
        
        logActivity({
          module: 'Water Management',
          action: 'Delivery Skipped',
          description: `Skipped delivery for ${customer.name}. Reason: ${reason}${remarks ? ` (${remarks})` : ''}`,
          status: 'warning',
          resourceType: 'Delivery',
          resourceId: String(deliveryId),
          resourceName: customer.name,
          newValue: {
            reason,
            remarks
          }
        });

        alert("Delivery marked as skipped.");
        router.back();
    } catch (e) {
        console.error("Failed to skip delivery", e);
        alert("Failed to skip. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="JalSejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Stop</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{customer.name}</h1>
          <div className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            <MapPin className="w-3 h-3" /> {customer.address}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Select Reason for Skip</h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 cursor-pointer active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${reason === 'Door Locked' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                  {reason === 'Door Locked' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <input type="radio" name="reason" value="Door Locked" className="hidden" checked={reason === 'Door Locked'} onChange={(e) => setReason(e.target.value)} />
                <span className="font-bold text-slate-900">Door Locked</span>
              </div>
              <Lock className="w-5 h-5 text-slate-400" />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 cursor-pointer active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${reason === 'No Stock Needed' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                  {reason === 'No Stock Needed' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <input type="radio" name="reason" value="No Stock Needed" className="hidden" checked={reason === 'No Stock Needed'} onChange={(e) => setReason(e.target.value)} />
                <span className="font-bold text-slate-900">No Stock Needed</span>
              </div>
              <PackageMinus className="w-5 h-5 text-slate-400" />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 cursor-pointer active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${reason === 'Customer Out of Station' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                  {reason === 'Customer Out of Station' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <input type="radio" name="reason" value="Customer Out of Station" className="hidden" checked={reason === 'Customer Out of Station'} onChange={(e) => setReason(e.target.value)} />
                <span className="font-bold text-slate-900">Customer Out of Station</span>
              </div>
              <Plane className="w-5 h-5 text-slate-400" />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 cursor-pointer active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${reason === 'Other' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                  {reason === 'Other' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <input type="radio" name="reason" value="Other" className="hidden" checked={reason === 'Other'} onChange={(e) => setReason(e.target.value)} />
                <span className="font-bold text-slate-900">Other</span>
              </div>
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-900">Add Remarks</h2>
          </div>
          <textarea 
            placeholder="Enter details here (optional)..."
            className="w-full bg-slate-100 rounded-2xl p-4 outline-none text-slate-900 resize-none h-24"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          ></textarea>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Kuch Khas Baat? (Anything specific?)</div>
        </div>

        <button 
          onClick={() => setShowConfirm(true)}
          className="w-full bg-orange-700 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-orange-700/30 mb-4"
        >
          <Ban className="w-5 h-5" /> Confirm Skip
        </button>
        <p className="text-xs text-center text-slate-500">This will mark delivery as &apos;Skipped&apos; for today</p>
      </main>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Skip</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to mark this delivery as skipped?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-slate-100 text-slate-900 font-bold py-3 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowConfirm(false);
                  handleSkip();
                }}
                className="flex-1 bg-orange-700 text-white font-bold py-3 rounded-xl"
              >
                Skip Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
