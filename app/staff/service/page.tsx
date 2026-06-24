'use client';

import { motion, AnimatePresence } from 'motion/react';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { 
  Search, 
  MapPin, 
  Phone, 
  LifeBuoy, 
  AlertTriangle, 
  ChevronRight, 
  Users, 
  CheckCircle2, 
  MessageCircle, 
  Undo2, 
  Navigation,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect, useMemo } from 'react';
import { logActivity } from '@/lib/activityLogger';

export default function CustomerService() {
  const router = useRouter();
  const { deliveries, setDeliveries, customers: rawCustomers, staff, businessInfo } = useAppContext();

  const customers = useMemo(() => {
    return Array.from(
      new Map((rawCustomers || []).map(item => [item.id, item])).values()
    );
  }, [rawCustomers]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [currentStaffId, setCurrentStaffId] = useState<number | null>(null);
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchStaffId = async () => {
      try {
        const pinAuth = typeof window !== 'undefined' ? localStorage.getItem('pinAuth') : null;
        const localStaffId = typeof window !== 'undefined' ? localStorage.getItem('staffUserId') : null;
        if (pinAuth === 'true' && localStaffId) {
          const currentStaff = staff.find(s => String(s.id) === localStaffId);
          if (currentStaff) {
            setCurrentStaffId(currentStaff.id);
          }
          return;
        }
        const { auth, db } = await import('@/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role === 'staff') {
             const currentStaff = staff.find(s => s.phone === userDoc.data().phone || s.name === userDoc.data().name);
             if (currentStaff) {
               setCurrentStaffId(currentStaff.id);
             }
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStaffId();
  }, [staff]);

  // Base list of deliveries for the staff
  const baseDeliveries = useMemo(() => {
    return deliveries.filter(d => currentStaffId === null || String(d.staffId) === String(currentStaffId));
  }, [deliveries, currentStaffId]);

  const mappedList = useMemo(() => {
    return baseDeliveries.map(delivery => {
      const customer = customers.find(c => c.id === delivery.customerId);
      const safeStatus = (delivery.status || 'pending').toLowerCase();
      return {
        delivery: {
          ...delivery,
          status: safeStatus
        },
        customer
      };
    }).filter(item => item.customer !== undefined);
  }, [baseDeliveries, customers]);

  const filteredList = useMemo(() => {
    return mappedList.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.customer!.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.customer!.route && item.customer!.route.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.delivery.skipReason && item.delivery.skipReason.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesFilter = true;
      const status = item.delivery.status;
      if (filterType === 'Pending') {
        matchesFilter = status === 'pending';
      } else if (filterType === 'Skipped') {
        matchesFilter = status === 'skipped';
      } else if (filterType === 'Completed') {
        matchesFilter = status === 'completed' || status === 'delivered';
      }

      return matchesSearch && matchesFilter;
    });
  }, [mappedList, searchQuery, filterType]);

  // Count statuses for filter pills
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: mappedList.length, Pending: 0, Skipped: 0, Completed: 0 };
    mappedList.forEach(item => {
      const status = item.delivery.status;
      if (status === 'pending') {
        map.Pending = (map.Pending || 0) + 1;
      } else if (status === 'skipped') {
        map.Skipped = (map.Skipped || 0) + 1;
      } else if (status === 'completed' || status === 'delivered') {
        map.Completed = (map.Completed || 0) + 1;
      }
    });
    return map;
  }, [mappedList]);

  const filterOptions = ['All', 'Pending', 'Skipped', 'Completed'];

  // Pending Skips: status === 'skipped'
  const pendingSkipsCount = baseDeliveries.filter(d => (d.status || 'pending').toLowerCase() === 'skipped').length;

  // Completed Today: status === 'completed' && date === today
  const completedTodayCount = baseDeliveries.filter(d => {
    const status = (d.status || 'pending').toLowerCase();
    const isCompleted = status === 'completed' || status === 'delivered';
    return isCompleted && d.date === today;
  }).length;

  const handleCompleteDelivery = async (deliveryId: string) => {
    try {
      const delivery = deliveries.find(d => String(d.id) === String(deliveryId));
      const customer = delivery ? customers.find(c => c.id === delivery.customerId) : null;
      const qty = customer?.defaultQty || delivery?.deliveredQty || 1;

      const { db } = await import('@/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      
      const deliveryRef = doc(db, 'deliveries', deliveryId);
      await updateDoc(deliveryRef, {
        status: 'completed',
        deliveredQty: qty,
        delivered_at: new Date().toISOString()
      });

      const updated = deliveries.map(d => 
        String(d.id) === String(deliveryId) ? { ...d, status: 'completed', deliveredQty: qty } : d
      );
      setDeliveries(updated);

      logActivity(
        'delivery_completed',
        `Completed delivery of ${qty} jars to ${customer?.name || 'Customer'} via service console`,
        {
          delivery_id: deliveryId,
          customer_id: customer?.id || '',
          customer_name: customer?.name || '',
          delivered_qty: qty,
          payment_amount: 0,
          payment_mode: 'unpaid'
        }
      );
    } catch (error) {
      console.error("Error completing delivery: ", error);
      const delivery = deliveries.find(d => String(d.id) === String(deliveryId));
      const customer = delivery ? customers.find(c => c.id === delivery.customerId) : null;
      const qty = customer?.defaultQty || delivery?.deliveredQty || 1;
      const updated = deliveries.map(d => 
        String(d.id) === String(deliveryId) ? { ...d, status: 'completed', deliveredQty: qty } : d
      );
      setDeliveries(updated);
    }
  };

  const handleWhatsAppAlert = async (customer: any) => {
    try {
      const { sendReminderWhatsApp } = await import('@/lib/whatsappUtils');
      sendReminderWhatsApp(customer, businessInfo);
    } catch (e) {
      alert("Failed to send WhatsApp alert");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Customer Service" subtitle="Resolve Skipped Deliveries" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Intro */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 px-2 text-[10px] font-mono bg-orange-100 text-orange-700 font-bold rounded-lg uppercase">Staff Tool</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Re-attempts</h1>
          <p className="text-sm text-slate-600">Track and fulfill skipped client drops to maximize deliveries.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-4">
            <div className="text-2xl font-bold text-orange-700">{pendingSkipsCount}</div>
            <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mt-1">Pending Skips</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4">
            <div className="text-2xl font-bold text-emerald-700">{completedTodayCount}</div>
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">Completed Today</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search name, route, or reason..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-500 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4 font-sans">
          {filterOptions.map(opt => {
            const count = counts[opt] || 0;
            return (
              <button
                type="button"
                key={opt}
                onClick={() => setFilterType(opt)}
                className={`px-4 py-2 rounded-full font-sans font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  filterType === opt 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                <span>{opt}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterType === opt ? 'bg-blue-700 text-blue-100' : 'bg-slate-300 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List of Skipped Deliveries */}
        <div className="space-y-4">
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Perfect Score!</h3>
              <p className="text-sm text-slate-500 max-w-xs">No pending skipped deliveries match your filter. Excellent work on the ground!</p>
              <Link href="/staff/dashboard" className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredList.map(({ delivery, customer }, index) => {
                if (!customer) return null;
                const deliveryStatus = delivery.status;
                return (
                  <motion.div 
                    layout
                    key={delivery.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`bg-white rounded-3xl p-5 shadow-sm border border-slate-100 border-l-4 relative ${
                      deliveryStatus === 'skipped' ? 'border-l-orange-500' :
                      deliveryStatus === 'completed' || deliveryStatus === 'delivered' ? 'border-l-emerald-500' :
                      'border-l-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          deliveryStatus === 'skipped' ? 'text-orange-600 bg-orange-50 border border-orange-100' :
                          deliveryStatus === 'completed' || deliveryStatus === 'delivered' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' :
                          'text-blue-600 bg-blue-50 border border-blue-100'
                        }`}>
                          {deliveryStatus === 'skipped' ? `Skipped: ${delivery.skipReason || 'Other'}` :
                           deliveryStatus === 'completed' || deliveryStatus === 'delivered' ? 'Completed' : 'Pending'}
                        </span>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight mt-1.5">{customer.name}</h3>
                        {customer.route && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1">
                            <Navigation className="w-3 h-3 text-slate-400" /> {customer.route}
                          </span>
                        )}
                      </div>
                      
                      <span className="text-xs font-mono text-slate-400 font-semibold">{delivery.date}</span>
                    </div>

                    {delivery.skipRemarks && (
                      <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 italic">
                        &ldquo;{delivery.skipRemarks}&rdquo;
                      </div>
                    )}

                    <div className="flex items-start gap-1.5 text-xs text-slate-500 my-4">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> 
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>

                    {/* Meta drop detail */}
                    <div className="bg-blue-50/50 p-3 rounded-2xl mb-4 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-slate-500">Scheduled:</span> <strong className="text-blue-700">{customer.defaultQty} Cans</strong>
                      </div>
                      <div className="w-px h-4 bg-slate-200"></div>
                      <div>
                        <span className="text-slate-500">Balance Empty:</span> <strong className="text-slate-700">{customer.emptyBalance} Cans</strong>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => router.push(`/staff/delivery/${delivery.id}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-blue-600/10"
                      >
                        <Undo2 className="w-4 h-4" /> Edit Details
                      </button>
                      
                      {/* Direct Click to Complete Tick icon */}
                      {deliveryStatus !== 'completed' && deliveryStatus !== 'delivered' && (
                        <button 
                          onClick={() => handleCompleteDelivery(String(delivery.id))}
                          className="w-12 h-11 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-xl flex items-center justify-center active:scale-95 transition-transform shrink-0"
                          title="Mark Completed"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                      
                      <a href={`tel:${customer.phone}`} className="w-12 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center active:scale-95 transition-transform shrink-0">
                        <Phone className="w-4 h-4" />
                      </a>
                      
                      <button 
                        onClick={() => handleWhatsAppAlert(customer)}
                        className="w-12 h-11 bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 rounded-xl flex items-center justify-center active:scale-95 transition-transform shrink-0"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </main>

      <BottomNav role="staff" activeTab="service" />
    </div>
  );
}
