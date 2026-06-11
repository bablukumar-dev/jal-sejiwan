'use client';

import TopAppBar from '@/components/TopAppBar';
import { MapPin, Phone, Droplet, Package, Plus, Minus, CheckCircle2, AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { logActivity } from '@/lib/activityLogger';

export default function DeliveryEntry() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = Number(params.id);
  const { deliveries, customers, setDeliveries, setCustomers, setInventory, setPayments, businessInfo, inventory, payments } = useAppContext();

  const delivery = deliveries.find(d => d.id === deliveryId);
  const customer = customers.find(c => c.id === delivery?.customerId);

  const [delivered, setDelivered] = useState((delivery as any)?.deliveredQty || 0);
  const [empties, setEmpties] = useState((delivery as any)?.returnedEmpty || 0);
  const [paymentType, setPaymentType] = useState<'Cash' | 'UPI' | 'Due'>('Cash');
  const [date, setDate] = useState(delivery?.date || new Date().toISOString().split('T')[0]);
  const [hasDamaged, setHasDamaged] = useState(false);
  const [damagedQty, setDamagedQty] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const [customCollectedStr, setCustomCollectedStr] = useState<string | null>(null);

  const [userRole, setUserRole] = useState<'owner' | 'manager' | 'staff'>(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'owner' || storedRole === 'manager' || storedRole === 'staff') {
        return storedRole;
      }
    }
    return 'staff';
  });

  const [hasInitializedRate, setHasInitializedRate] = useState(false);
  const [currentRate, setCurrentRate] = useState<number>(45);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
    });
    
    const handleOnline = () => {
      requestAnimationFrame(() => setIsOffline(false));
      // Simulate sync when coming online
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 1500);
    };
    
    const handleOffline = () => requestAnimationFrame(() => setIsOffline(true));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fetch up-to-date role from Firestore
    const checkRole = async () => {
      try {
        const { auth, db } = await import('@/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            if (role === 'owner' || role === 'manager' || role === 'staff') {
              setUserRole(role);
              localStorage.setItem('userRole', role);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkRole();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (customer && !hasInitializedRate) {
      requestAnimationFrame(() => {
        setCurrentRate(customer.rate || businessInfo?.defaultRate || 45);
        setHasInitializedRate(true);
      });
    }
  }, [customer, businessInfo, hasInitializedRate]);

  if (!delivery || !customer) {
    return <div className="p-4">Loading...</div>;
  }

  const subtotal = delivered * currentRate;

  const amountToDisplayStr = customCollectedStr !== null 
    ? customCollectedStr 
    : (paymentType === 'Due' ? '0' : subtotal.toString());

  const handleConfirm = () => {
    const prevDeliveries = [...deliveries];
    const prevInventory = {...inventory};
    const prevPayments = [...payments];
    const prevCustomers = [...customers];

    try {
        if (!otpSent) {
           const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
           setGeneratedOtp(randomOtp);
           setOtpSent(true);
           setOtpInput('');
           alert(`OTP Sent to Customer: ${randomOtp} (Simulation)`);
           return;
        }

        if (otpInput !== generatedOtp) {
            alert('Invalid OTP. Please try again.');
            return;
        }

        const parsedAmount = parseFloat(amountToDisplayStr) || 0;

        // Update delivery
        const updatedDeliveries = deliveries.map(d => 
        d.id === deliveryId ? { 
          ...d, 
          status: 'delivered', 
          deliveredQty: delivered, 
          returnedEmpty: empties, 
          date: date,
          paymentReceived: parsedAmount > 0,
          paymentAmount: parsedAmount,
          paymentMode: paymentType,
          rate: currentRate
        } : d
        );
        setDeliveries(updatedDeliveries);

        // Update inventory. Warehouse stock is managed by Dispatch/Reconcile.
        setInventory(prev => ({
        ...prev,
        cansWithCustomers: prev.cansWithCustomers + delivered - empties
        }));

        // Handle payment
        let newDue = customer.due;

        if (paymentType === 'Due') {
          newDue += subtotal;
        } else {
          // Unpaid difference gets added to customer due balance, or extra payment gets subtracted
          newDue += (subtotal - parsedAmount);

          if (parsedAmount > 0) {
            const currentBusinessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') || 'default_business' : 'default_business';
            const newPayment = {
              id: Date.now(),
              customerId: customer.id,
              customerName: customer.name,
              date: date,
              amount: parsedAmount,
              mode: paymentType,
              collectedBy: 'Staff',
              note: `DEL-${deliveryId}`,
              businessId: currentBusinessId
            };
            setPayments(prev => [newPayment, ...prev]);
          }
        }

        // Update customer
        const updatedCustomers = customers.map(c => 
        c.id === customer.id ? { 
            ...c, 
            due: newDue, 
            emptyBalance: c.emptyBalance + delivered - empties - damagedQty, 
            lastDelivery: date,
            rate: currentRate 
        } : c
        );
        setCustomers(updatedCustomers);
        
        // Log delivery complete activity silently in background
        logActivity(
          'delivery_completed',
          `Completed delivery to ${customer.name}: ${delivered} Cans, ${empties} Empties returned, payment ₹${parsedAmount} (${paymentType})`,
          {
            delivery_id: deliveryId,
            customer_id: customer.id,
            customer_name: customer.name,
            delivered_qty: delivered,
            returned_empty_qty: empties,
            damaged_qty: damagedQty,
            payment_amount: parsedAmount,
            payment_mode: paymentType,
          }
        );

        alert("Delivery Recorded Successfully!");
        router.back();
    } catch (e) {
        setDeliveries(prevDeliveries);
        setInventory(prevInventory);
        setPayments(prevPayments);
        setCustomers(prevCustomers);
        console.error("Failed to record delivery", e);
        alert("Failed to record delivery. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="JalSejiwan" subtitle={`Route: ${customer.route}`} showBack={true} />

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
        {/* Customer Info */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Stop</div>
              <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
              <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                <MapPin className="w-3 h-3" /> {customer.address}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-center min-w-[70px]">
              <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Due</div>
              <div className="text-lg font-bold text-blue-700">₹{customer.due}</div>
            </div>
          </div>

          <div className="bg-slate-100 rounded-2xl p-4 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <Phone className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact</div>
                <div className="font-bold text-slate-900">{customer.phone}</div>
              </div>
            </div>
            <a href={`tel:${customer.phone}`} className="bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm active:scale-95 transition-transform">
              CALL NOW
            </a>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-slate-900">Delivery Date</div>
            <input 
              type="date" 
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Droplet className="w-5 h-5 text-blue-600 fill-current" />
          <h2 className="text-lg font-bold text-slate-900">Delivery Entry</h2>
        </div>

        {/* Delivery Input */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Droplet className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">20L Jar (Chilled)</h3>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span>Rate:</span>
                  {(userRole === 'owner' || userRole === 'manager') ? (
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-800 focus-within:ring-1 focus-within:ring-blue-600 transition-all select-all">
                      <span className="text-blue-700">₹</span>
                      <input
                        type="number"
                        min="0"
                        className="w-12 bg-transparent border-none font-bold text-slate-950 outline-none text-xs p-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={currentRate || ''}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setCurrentRate(val);
                        }}
                      />
                      <span className="text-slate-400 font-normal">/ unit</span>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-800">₹{currentRate} / unit</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subtotal</div>
              <div className="text-lg font-bold text-blue-700">₹{subtotal}</div>
            </div>
          </div>

          <div className="bg-slate-100 rounded-2xl p-2 flex items-center justify-between">
            <button 
              onClick={() => setDelivered(Math.max(0, delivered - 1))}
              className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <Minus className="w-6 h-6 text-red-600" />
            </button>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{delivered.toString().padStart(2, '0')}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bottles</div>
            </div>
            <button 
              onClick={() => setDelivered(delivered + 1)}
              className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Empty Return Input */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-700">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Empty Return</h3>
              <div className="text-xs text-slate-500">Collect empty jars</div>
            </div>
          </div>

          <div className="bg-slate-100 rounded-2xl p-2 flex items-center justify-between">
            <button 
              onClick={() => setEmpties(Math.max(0, empties - 1))}
              className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <Minus className="w-6 h-6 text-slate-600" />
            </button>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{empties.toString().padStart(2, '0')}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Empties</div>
            </div>
            <button 
              onClick={() => setEmpties(empties + 1)}
              className="w-14 h-14 bg-orange-700 rounded-xl flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Damaged Return Toggle */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Damaged Return</h3>
                <div className="text-xs text-slate-500">Collect damaged cans</div>
              </div>
            </div>
            <button 
              onClick={() => {
                const newVal = !hasDamaged;
                setHasDamaged(newVal);
                if (newVal) setDamagedQty(1);
                else setDamagedQty(0);
              }}
              className={`w-12 h-6 rounded-full relative transition-colors ${hasDamaged ? 'bg-red-600' : 'bg-slate-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${hasDamaged ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </button>
          </div>

          {hasDamaged && (
            <div className="bg-slate-100 rounded-2xl p-2 flex items-center justify-between mt-4">
              <button 
                onClick={() => setDamagedQty(Math.max(1, damagedQty - 1))}
                className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              >
                <Minus className="w-6 h-6 text-slate-600" />
              </button>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{damagedQty.toString().padStart(2, '0')}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Damaged</div>
              </div>
              <button 
                onClick={() => setDamagedQty(damagedQty + 1)}
                className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        {/* Payment Type */}
        <div className="bg-slate-100 rounded-2xl p-4 mb-6">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Payment Type</div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setPaymentType('Cash');
                // Automatically reset editing if switched
                setCustomCollectedStr(null);
              }}
              className={`flex-1 font-bold py-3 rounded-xl text-sm ${paymentType === 'Cash' ? 'bg-white border-2 border-blue-600 text-blue-700' : 'bg-white border-2 border-transparent text-slate-600'}`}
            >
              Cash
            </button>
            <button 
              onClick={() => {
                setPaymentType('UPI');
                setCustomCollectedStr(null);
              }}
              className={`flex-1 font-bold py-3 rounded-xl text-sm ${paymentType === 'UPI' ? 'bg-white border-2 border-blue-600 text-blue-700' : 'bg-white border-2 border-transparent text-slate-600'}`}
            >
              UPI
            </button>
            <button 
              onClick={() => {
                setPaymentType('Due');
                setCustomCollectedStr(null);
              }}
              className={`flex-1 font-bold py-3 rounded-xl text-sm ${paymentType === 'Due' ? 'bg-white border-2 border-blue-600 text-blue-700' : 'bg-white border-2 border-transparent text-slate-600'}`}
            >
              Due
            </button>
          </div>
        </div>

        {/* Amount Received / Cash Collected */}
        {paymentType !== 'Due' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">Amount Received / Cash Collected (₹)</span>
            </div>
            <div className="relative">
              <input 
                id="amountReceivedInput"
                type="number" 
                pattern="[0-9]*"
                inputMode="decimal"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-extrabold text-lg text-slate-900 placeholder:font-medium transition-all"
                value={amountToDisplayStr}
                onChange={(e) => {
                  setCustomCollectedStr(e.target.value);
                }}
                placeholder="Enter collected amount..."
              />
              {customCollectedStr !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomCollectedStr(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                >
                  Reset (₹{subtotal})
                </button>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-medium leading-normal mt-2.5">
              Enter the actual amount received from the customer. If partial cash is received, we will automatically set the remainder to the customer&apos;s pending overall due.
            </div>
          </div>
        )}

        {/* OTP Verification */}
        {otpSent && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-2">Delivery OTP Verification</div>
            <input 
              type="text" 
              placeholder="Enter 4-digit OTP" 
              maxLength={4}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-2xl tracking-[0.5em] font-bold rounded-xl outline-none focus:ring-2 focus:ring-blue-600 py-3"
            />
            <div className="text-xs text-blue-600 text-center mt-2">Ask the customer for the OTP received on their phone</div>
          </div>
        )}

      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Collected</div>
              <div className="text-3xl font-bold text-slate-900">₹{paymentType === 'Due' ? '0.00' : (parseFloat(amountToDisplayStr) || 0).toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Summary</div>
              <div className="font-bold text-blue-800">{delivered} Jars / {empties} Empties</div>
            </div>
          </div>
          <button 
            onClick={handleConfirm}
            className={`w-full text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform ${otpSent ? 'bg-emerald-600' : 'bg-blue-700'}`}
          >
            {otpSent ? 'VERIFY OTP & DELIVER' : 'SEND OTP'} <CheckCircle2 className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
