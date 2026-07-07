'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { MapPin, Phone, Plus, AlertTriangle, ChevronRight, Navigation, XCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { sendReminderWhatsApp } from '@/lib/whatsappUtils';

export default function MyRoute() {
  const router = useRouter();
  const { deliveries, setDeliveries, customers, staff, businessInfo, currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending');
  const [staffRoute, setStaffRoute] = useState('');
  const [currentStaffId, setCurrentStaffId] = useState<number | null>(null);
  
  useEffect(() => {
    // 1. Check PIN-based authentication first
    const pinAuth = typeof window !== 'undefined' ? localStorage.getItem('pinAuth') : null;
    const localStaffId = typeof window !== 'undefined' ? localStorage.getItem('staffUserId') : null;
    if (pinAuth === 'true' && localStaffId) {
      const currentStaff = staff.find(s => String(s.id) === localStaffId);
      if (currentStaff) {
        requestAnimationFrame(() => {
          if (currentStaff.route) setStaffRoute(currentStaff.route);
          setCurrentStaffId(currentStaff.id);
        });
        return;
      }
    }

    // 2. Otherwise use current user
    if (currentUser && currentUser.role === 'staff') {
      const staffMember = staff.find(s => s.id.toString() === currentUser.uid) || 
                          staff.find(s => s.name === currentUser.name);
      if (staffMember) {
        requestAnimationFrame(() => {
          if (staffMember.route) setStaffRoute(staffMember.route);
          setCurrentStaffId(staffMember.id);
        });
      }
    }
  }, [currentUser, staff]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const routeCustomers = customers.filter(c => c.route && c.route.toLowerCase() === staffRoute.toLowerCase());
  
  const mappedDeliveries = routeCustomers.map(customer => {
    // Find if there is a delivery record for today
    const deliveryToday = deliveries.find(d => d.customerId === customer.id && d.date === today);
    return {
      customer,
      delivery: deliveryToday || {
        id: `mock_${customer.id}`, // specific known ID we can intercept, but we will not link directly to this string ID
        customerId: customer.id,
        date: today,
        status: 'Pending' as const,
        staffId: currentStaffId,
        priority: 'Normal'
      }
    };
  });

  const pendingList = mappedDeliveries.filter(m => m.delivery.status?.toLowerCase() !== 'delivered' && m.delivery.status !== 'Skipped');
  const completedList = mappedDeliveries.filter(m => m.delivery.status?.toLowerCase() === 'delivered' || m.delivery.status === 'Skipped');

  const displayList = activeTab === 'Pending' ? pendingList : completedList;

  const generateDelivery = useCallback((customerId: number) => {
    const currentBusinessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') || 'default_business' : 'default_business';
    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      customerId: customerId,
      customerName: customers.find(c => c.id === customerId)?.name || '',
      date: today,
      status: 'Pending' as const,
      staffId: currentStaffId || 0,
      staffName: staff.find(s => s.id === currentStaffId)?.name || '',
      deliveredQty: 0,
      returnedEmpty: 0,
      paymentReceived: false,
      paymentAmount: 0,
      paymentMode: 'Cash',
      note: '',
      businessId: currentBusinessId
    };
  }, [customers, today, currentStaffId, staff]);

  const handleRecordDelivery = useCallback((customerId: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const existing = deliveries.find(d => d.customerId === customerId && d.date === today);
    if (existing) {
      router.push(`/staff/delivery/${existing.id}`);
    } else {
      const newDelivery = generateDelivery(customerId);
      setDeliveries([...deliveries, newDelivery]);
      router.push(`/staff/delivery/${newDelivery.id}`);
    }
  }, [deliveries, today, router, setDeliveries, generateDelivery]);

  const handleSkipDelivery = useCallback((customerId: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const existing = deliveries.find(d => d.customerId === customerId && d.date === today);
    if (existing) {
      router.push(`/staff/skip/${existing.id}`);
    } else {
      const newDelivery = generateDelivery(customerId);
      setDeliveries([...deliveries, newDelivery]);
      router.push(`/staff/skip/${newDelivery.id}`);
    }
  }, [deliveries, today, router, setDeliveries, generateDelivery]);

  const handleManualRouteAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    const newRoute = prompt('Enter your route name manually:');
    if (newRoute && newRoute.trim()) {
      setStaffRoute(newRoute.trim());
      alert(`Route changed to: ${newRoute}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="JalSejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Task</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Route: {staffRoute || 'No Route'}</h1>
          <p className="text-sm text-slate-600">{pendingList.length} Drops Remaining • {completedList.length} Completed Today</p>
        </div>


            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button 
                onClick={() => setActiveTab('Pending')}
                className={`flex-1 font-bold py-2 rounded-lg text-sm transition-colors ${activeTab === 'Pending' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
              >
                Pending
              </button>
              <button 
                onClick={() => setActiveTab('Completed')}
                className={`flex-1 font-bold py-2 rounded-lg text-sm transition-colors ${activeTab === 'Completed' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
              >
                View Completed
              </button>
            </div>

            {/* Route Info & Controls Bar */}
            <div className="flex gap-2 w-full mb-6">
              <button 
                type="button"
                onClick={handleManualRouteAdd} 
                className="flex-1 bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-center"
              >
                <Plus className="w-4 h-4" /> MANUAL ROUTE
              </button>
              <div className="flex-1 bg-white text-slate-800 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-slate-100 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> {staffRoute || 'No Route'}
              </div>
            </div>

            {/* Route List */}
            <div className="route-list space-y-4">
              {displayList.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Data Available</h3>
                  <p className="text-sm text-slate-500">There are no customers mapped to your route.</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {displayList.map(({ delivery, customer }, index) => {
                    if (!customer) return null;

                    const isFirstPending = activeTab === 'Pending' && index === 0;

                    return (
                      <motion.div 
                        layout
                        key={customer.id}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                        className={`bg-white rounded-3xl p-5 shadow-sm border ${isFirstPending ? 'border-blue-200 border-l-4 border-l-blue-600' : 'border-slate-100 border-l-4 border-l-slate-300 opacity-70'} relative`}
                      >
                        <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-lg flex items-center justify-center font-bold border-2 border-white shadow-sm ${isFirstPending ? 'bg-slate-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                          {index + 1}
                        </div>
                      
                      <div className="flex justify-between items-start mb-2 ml-4">
                        <div className="flex items-start gap-2 max-w-[70%]">
                          <h3 className="font-bold text-slate-900 text-lg leading-tight">{customer.name}</h3>
                          {customer.due > 0 && (
                            <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5">
                              Due ₹{customer.due}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {customer.due > 1000 && <span className="bg-orange-100 text-orange-700 text-[8px] font-bold px-2 py-1 rounded uppercase tracking-wider">Urgent</span>}
                          {delivery.priority && (
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                              delivery.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                              delivery.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-green-100 text-green-700 border-green-200'
                            }`}>
                              {delivery.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-4 ml-4">
                        <MapPin className="w-3 h-3" /> {customer.address}
                      </div>

                      <div className="flex gap-4 mb-4 ml-4">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deliver</div>
                          <div className="font-bold text-blue-700 text-lg">{customer.defaultQty} <span className="text-xs font-normal text-slate-500">cans</span></div>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Empties</div>
                          <div className="font-bold text-slate-700 text-lg">{customer.emptyBalance} <span className="text-xs font-normal text-slate-500">cans</span></div>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Amt</div>
                          <div className="font-bold text-red-600 text-lg">₹{customer.due}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {delivery.status?.toLowerCase() !== 'delivered' && delivery.status !== 'Skipped' ? (
                          <>
                            <button onClick={(e) => handleSkipDelivery(customer.id, e)} className="w-20 bg-orange-100 text-orange-700 font-bold rounded-xl flex items-center justify-center text-xs active:scale-95 transition-transform flex-col gap-0.5">
                              <XCircle className="w-4 h-4" /> Skip
                            </button>
                            <motion.button 
                              whileHover={{ scale: 1.02 }} 
                              whileTap={{ scale: 0.95 }} 
                              onClick={(e) => handleRecordDelivery(customer.id, e)} 
                              className={`flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform ${isFirstPending ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                              <Plus className="w-5 h-5" /> Record
                            </motion.button>
                          </>
                        ) : (
                          <div className="flex-1 bg-slate-100 text-slate-500 font-bold py-3 rounded-xl flex flex-col items-center justify-center text-sm leading-tight">
                            <span>{delivery.status}</span>
                            {delivery.status === 'Skipped' && delivery.skipReason && (
                              <span className="text-[10px] text-red-500 mt-0.5">{delivery.skipReason}</span>
                            )}
                          </div>
                        )}
                        <a href={`tel:${customer.phone}`} className="w-12 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center active:scale-95 transition-transform shrink-0">
                          <Phone className="w-5 h-5" />
                        </a>
                        <button onClick={async () => {
                          try {
                            sendReminderWhatsApp(customer, businessInfo);
                          } catch (e) {
                            alert('Failed to send reminder');
                          }
                        }} className="w-12 bg-green-50 border border-green-200 text-green-600 rounded-xl flex items-center justify-center active:scale-95 transition-transform shrink-0">
                           <MessageCircle className="w-5 h-5" />
                        </button>
                        {delivery.status?.toLowerCase() !== 'delivered' && delivery.status !== 'Skipped' && (
                          <a href={`https://maps.google.com/?q=${encodeURIComponent(customer.address)}`} target="_blank" rel="noopener noreferrer" className="w-12 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center active:scale-95 transition-transform shrink-0">
                            <MapPin className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              )}
            </div>


        {/* Finish Route Banner */}
        {pendingList.length > 0 && (
          <div className="bg-slate-200 rounded-3xl p-6 mt-8 border border-slate-300 border-dashed text-center">
            <h3 className="font-bold text-slate-900 mb-1">Finish Route?</h3>
            <p className="text-sm text-slate-600 mb-4">You have {pendingList.length} more stops to complete today&apos;s goal.</p>
            <div className="flex gap-2">
              <button className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-transform">
                Complete {staffRoute || 'Route'}
              </button>
              <button className="w-12 bg-orange-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Floating Next Stop */}
      {pendingList.length > 0 && (
        <div className="fixed bottom-24 right-6 z-40">
          <button onClick={(e) => handleRecordDelivery(pendingList[0].customer.id, e)} className="bg-blue-600 text-white font-bold py-4 px-6 rounded-full shadow-lg shadow-blue-600/30 flex items-center gap-2 active:scale-95 transition-transform">
            NEXT STOP <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <BottomNav role="staff" activeTab="route" />
    </div>
  );
}
