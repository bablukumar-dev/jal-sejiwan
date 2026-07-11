'use client';

import TopAppBar from '@/components/TopAppBar';
import { Search, Calendar, CheckCircle2, X, WifiOff, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { logActivity } from '@/lib/activityLogger';
import { addPayment, updateCustomer } from '@/lib/firestore-service';
import { validateAmount } from '@/lib/validation';

export default function RecordPayment() {
  const router = useRouter();
  const { customers, payments, setPayments, setCustomers, currentUser } = useAppContext();
  const [amount, setAmount] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [mode, setMode] = useState('Cash');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
    
    const handleOnline = () => {
      setIsOffline(false);
      // Simulate sync when coming online
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 1500);
    };
    
    const handleOffline = () => setIsOffline(true);
 
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
 
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const filteredCustomers = customers.filter(c => {
    if (!debouncedSearchQuery) return false;
    const query = debouncedSearchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(query) || c.phone?.includes(debouncedSearchQuery);
  });

  const handleNumberClick = (num: string) => {
    if (amount === '0') {
      setAmount(num);
    } else {
      setAmount(amount + num);
    }
  };

  const handleClear = () => {
    setAmount('0');
  };

  const handleBackspace = () => {
    if (amount.length > 1) {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount('0');
    }
  };

  const handleQuickAmount = (val: string) => {
    setAmount(val);
  };

  const handleSave = async () => {
    console.log("--- TRACE: RecordPayment handleSave START ---");
    try {
      console.log("--- TRACE: Validating Amount:", amount);
      const parsedAmount = validateAmount(amount, false, 1000000);
      if (!parsedAmount.valid) {
        console.warn("--- TRACE FAILURE: Invalid Amount:", parsedAmount.error);
        alert(parsedAmount.error || 'Invalid amount entered');
        return;
      }
      
      const numAmount = parsedAmount.value;
      console.log("--- TRACE: Selected Customer ID:", selectedCustomerId);
      if (!selectedCustomerId || !selectedCustomer) {
        console.warn("--- TRACE FAILURE: No customer selected ---");
        alert('Please select a customer');
        return;
      }

      console.log("--- TRACE: Current User:", JSON.stringify(currentUser, null, 2));
      if (!currentUser) {
        console.error("--- TRACE FAILURE: No currentUser in handleSave ---");
        alert('Session expired. Please login again.');
        return;
      }

      // 1. Record payment in Firestore
      const paymentData = {
        customerId: selectedCustomerId,
        customerName: selectedCustomer.name,
        amount: numAmount,
        date,
        mode,
        collectedBy: currentUser.name || 'Owner',
        note: '',
      };

      console.log("--- TRACE: Calling addPayment with Payload:", JSON.stringify(paymentData, null, 2));
      const docRef = await addPayment(paymentData, currentUser);
      console.log("--- TRACE: addPayment SUCCESS. Doc ID:", docRef.id);

      // 2. Update customer due balance
      console.log("--- TRACE: Updating Customer Due Balance. Previous Due:", selectedCustomer.due, "New Due:", Math.max(0, selectedCustomer.due - numAmount));
      await updateCustomer(selectedCustomerId, {
        due: Math.max(0, selectedCustomer.due - numAmount)
      }, currentUser);
      console.log("--- TRACE: updateCustomer SUCCESS ---");

      logActivity({
        module: 'Payments',
        action: 'Payment Collected',
        description: `Collected payment of ₹${numAmount} from ${selectedCustomer.name} (${mode})`,
        status: 'success',
        resourceType: 'Payment',
        resourceId: docRef.id,
        resourceName: selectedCustomer.name,
        newValue: { ...paymentData, id: docRef.id }
      });

      console.log("--- TRACE: RecordPayment handleSave SUCCESS ---");
      alert('Payment Recorded Successfully');
      router.back();
    } catch (e: any) {
      console.error("--- TRACE FAILURE: RecordPayment handleSave Error ---");
      console.error(e);
      logActivity({
        module: 'Payments',
        action: 'Payment Collection Failed',
        description: `Failed to record payment from ${selectedCustomer?.name || 'Unknown'}: ${e.message || e}`,
        status: 'error',
        failureReason: e.message || String(e)
      }).catch(err => console.error("Error logging failed:", err));
      alert('Failed to record payment: ' + (e.message || e));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Record Payment" showBack={true} />

      {isOffline && (
        <div className="bg-orange-100 p-2 text-center flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">Offline Mode - Data will be saved locally</span>
        </div>
      )}
      
      {isSyncing && (
        <div className="bg-blue-100 p-2 text-center flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Syncing offline data...</span>
        </div>
      )}

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Customer Selection */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select Customer</label>
          <div className="relative flex items-center mb-4">
            <Search className="absolute left-4 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCustomerId(null);
              }}
            />
          </div>

          {searchQuery && !selectedCustomerId && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 max-h-40 overflow-y-auto mb-4">
              {filteredCustomers.map(c => (
                <button 
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomerId(c.id);
                    setSearchQuery('');
                  }}
                  className="w-full text-left p-3 border-b border-slate-200 hover:bg-slate-100"
                >
                  <div className="font-bold text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.address}</div>
                </button>
              ))}
            </div>
          )}

          {selectedCustomer && (
            <div className="bg-slate-50 rounded-xl p-4 border-l-4 border-l-blue-600 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900">{selectedCustomer.name}</h3>
                <div className="text-xs text-slate-500 mt-1">{selectedCustomer.address}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Pending Due</div>
                <div className="text-xl font-bold text-red-700">₹{selectedCustomer.due}</div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Mode</label>
            <select 
              className="w-full bg-transparent border-b-2 border-slate-200 pb-2 outline-none font-bold text-slate-900 text-lg appearance-none"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Date</label>
            <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent outline-none font-bold text-slate-900 text-sm" 
              />
            </div>
          </div>
        </div>

        {/* Amount Display */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-6 flex flex-col items-center justify-center">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Amount Collected (₹)</label>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-blue-400">₹</span>
            <span className="text-6xl font-bold text-blue-700">{amount}</span>
          </div>
        </div>

        {/* Keypad */}
        <div className="bg-slate-200 rounded-3xl p-4">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button 
                key={num} 
                onClick={() => handleNumberClick(num.toString())}
                className="bg-white rounded-2xl py-4 text-2xl font-bold text-slate-900 active:scale-95 transition-transform shadow-sm"
              >
                {num}
              </button>
            ))}
            <button 
              onClick={() => handleNumberClick('.')}
              className="bg-white rounded-2xl py-4 text-2xl font-bold text-slate-900 active:scale-95 transition-transform shadow-sm"
            >
              .
            </button>
            <button 
              onClick={() => handleNumberClick('0')}
              className="bg-white rounded-2xl py-4 text-2xl font-bold text-slate-900 active:scale-95 transition-transform shadow-sm"
            >
              0
            </button>
            <button 
              onClick={handleBackspace}
              className="bg-red-100 rounded-2xl py-4 flex items-center justify-center text-red-600 active:scale-95 transition-transform shadow-sm"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleClear}
              className="bg-white rounded-2xl py-4 font-bold text-slate-600 active:scale-95 transition-transform shadow-sm uppercase tracking-wider"
            >
              Clear
            </button>
            <button 
              onClick={handleSave}
              className="bg-blue-600 rounded-2xl py-4 font-bold text-white active:scale-95 transition-transform shadow-sm flex items-center justify-center gap-2"
            >
              Record Payment <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Amounts */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {['100', '200', '500', '1000'].map((val) => (
            <button 
              key={val}
              onClick={() => handleQuickAmount(val)}
              className="bg-slate-100 border border-slate-200 rounded-xl py-3 font-bold text-slate-700 active:scale-95 transition-transform"
            >
              ₹{val}
            </button>
          ))}
        </div>

      </main>
    </div>
  );
}
