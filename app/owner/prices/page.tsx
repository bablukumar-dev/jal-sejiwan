'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { useAppContext } from '@/app/context/AppContext';
import { useState } from 'react';

export default function PriceSettings() {
  const { businessInfo, setBusinessInfo } = useAppContext();
  const [rate, setRate] = useState(businessInfo.defaultRate.toString());
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = () => {
    try {
        setBusinessInfo({ ...businessInfo, defaultRate: Number(rate) || 0 });
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
    } catch(e) {
        console.error(e);
        alert('Failed to update price');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Price Settings" showBack={true} />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6">
          <h2 className="font-bold text-slate-900 mb-1">Default Bottle Rate</h2>
          <p className="text-sm text-slate-500 mb-6">Set the standard price per water bottle.</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Per Bottle Rate (₹)</label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-3 text-slate-500 font-bold">₹</span>
                <input 
                  type="number" 
                  className="w-full bg-slate-100 pl-8 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-900"
                  value={rate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRate(val ? Number(val).toString() : '');
                  }}
                />
              </div>
            </div>
            
            <button 
              onClick={handleSave}
              className={`w-full font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-white ${isSuccess ? 'bg-green-600 shadow-green-200' : 'bg-blue-600 shadow-blue-200'}`}
            >
              {isSuccess ? 'Updated Successfully!' : 'Update Price'}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-2">Note on custom pricing</h3>
          <p className="text-sm text-blue-800">
            You can set custom pricing for specific customers from their individual profile pages. The default rate set here will be applied to new customers.
          </p>
        </div>
      </main>
    </div>
  );
}
