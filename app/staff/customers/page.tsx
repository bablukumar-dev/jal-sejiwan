'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Search, MapPin, Phone, Plus, AlertTriangle, ChevronRight, XCircle, MessageCircle, Navigation, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect, useMemo } from 'react';

const getUniqueId = () => {
  return String(Date.now() + Math.floor(Math.random() * 1000));
};

export default function StaffCustomers() {
  const router = useRouter();
  const { deliveries, setDeliveries, customers: rawCustomers, staff, businessInfo, currentUser } = useAppContext();

  const customers = useMemo(() => {
    return Array.from(
      new Map((rawCustomers || []).map(item => [item.id, item])).values()
    );
  }, [rawCustomers]);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Completed'>('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [staffRoute, setStaffRoute] = useState('');
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  
  const userRole = currentUser?.role || '';
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
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

  const today = new Date().toISOString().split('T')[0];
  
  const searchedCustomers = useMemo(() => customers.filter(c => {
    if (!debouncedSearchQuery) return true;
    const q = debouncedSearchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.route?.toLowerCase().includes(q) || c.area?.toLowerCase().includes(q);
  }), [customers, debouncedSearchQuery]);

  const mappedDeliveries = useMemo(() => {
    return searchedCustomers.map(customer => {
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
  }, [searchedCustomers, deliveries, today, currentStaffId]);

  const displayList = useMemo(() => {
    if (activeTab === 'All') return mappedDeliveries;
    if (activeTab === 'Pending') return mappedDeliveries.filter(m => m.delivery.status?.toLowerCase() !== 'delivered');
    return mappedDeliveries.filter(m => m.delivery.status?.toLowerCase() === 'delivered');
  }, [activeTab, mappedDeliveries]);

  const pendingCount = mappedDeliveries.filter(m => m.delivery.status?.toLowerCase() !== 'delivered').length;
  const completedCount = mappedDeliveries.filter(m => m.delivery.status?.toLowerCase() === 'delivered').length;

  const handleRecordDelivery = (customerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    console.log("HandleRecordDelivery called for customer:", customerId);
    const existing = deliveries.find(d => d.customerId === customerId && d.date === today);
    if (existing) {
      console.log("Existing delivery found, routing to:", `/staff/delivery/${existing.id}`);
      router.push(`/staff/delivery/${existing.id}`);
    } else {
      console.log("No existing delivery, creating new one");
      const currentBusinessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') || 'default_business' : 'default_business';
      const newDelivery = {
        id: String(getUniqueId()),
        customerId: customerId,
        customerName: customers.find(c => c.id === customerId)?.name || '',
        date: today,
        status: 'Pending',
        staffId: currentStaffId || '',
        staffName: staff.find(s => s.id === currentStaffId)?.name || '',
        deliveredQty: 0,
        returnedEmpty: 0,
        paymentReceived: false,
        paymentAmount: 0,
        paymentMode: 'Cash',
        note: '',
        businessId: currentBusinessId
      };
      console.log("New delivery created:", newDelivery);
      setDeliveries([...deliveries, newDelivery]);
      router.push(`/staff/delivery/${newDelivery.id}`);
    }
  };

  const handleSkipDelivery = (customerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const existing = deliveries.find(d => d.customerId === customerId && d.date === today);
    if (existing) {
      router.push(`/staff/skip/${existing.id}`);
    } else {
      const currentBusinessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') || 'default_business' : 'default_business';
      const newDelivery = {
        id: String(getUniqueId()),
        customerId: customerId,
        customerName: customers.find(c => c.id === customerId)?.name || '',
        date: today,
        status: 'Pending',
        staffId: currentStaffId || '',
        staffName: staff.find(s => s.id === currentStaffId)?.name || '',
        deliveredQty: 0,
        returnedEmpty: 0,
        paymentReceived: false,
        paymentAmount: 0,
        paymentMode: 'Cash',
        note: '',
        businessId: currentBusinessId
      };
      setDeliveries([...deliveries, newDelivery]);
      router.push(`/staff/skip/${newDelivery.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="JalSejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Customers</h1>
            <p className="text-sm text-slate-600">Track & Deliver</p>
          </div>
          {(userRole === 'owner' || userRole === 'manager' || userRole === 'staff') && (
             <Link href={userRole === 'staff' ? '/staff/customers/add' : '/owner/customers/add'} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform text-sm">
               <Plus className="w-4 h-4" /> Add Customer
             </Link>
          )}
        </div>

        {/* Search Bar */}
            <div className="mb-6">
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search name, phone, or route..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-500 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button 
                onClick={() => setActiveTab('All')}
                className={`flex-1 font-bold py-2 rounded-lg text-sm transition-colors ${activeTab === 'All' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveTab('Pending')}
                className={`flex-1 font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1 ${activeTab === 'Pending' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
              >
                Pending <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              </button>
              <button 
                onClick={() => setActiveTab('Completed')}
                className={`flex-1 font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1 ${activeTab === 'Completed' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
              >
                Done <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full">{completedCount}</span>
              </button>
            </div>

            {/* Customer List */}
            <div className="route-list space-y-4">
          {displayList.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No customers yet</h3>
              <p className="text-sm text-slate-500">Try adjusting your search or tab filter.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayList.map(({ delivery, customer }, index) => {
                if (!customer) return null;

              const isFirstPending = activeTab === 'Pending' && index === 0 && !searchQuery;

              return (
                <motion.div 
                  layout
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={`bg-white rounded-3xl p-5 shadow-sm border ${isFirstPending ? 'border-blue-200 border-l-4 border-l-blue-600' : 'border-slate-100 border-l-4 border-l-slate-300 opacity-90'} relative`}
                >
                  {isFirstPending && (
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg flex items-center justify-center font-bold border-2 border-white shadow-sm bg-slate-200 text-blue-700">
                      {index + 1}
                    </div>
                  )}
                
                <div className="flex justify-between items-start mb-2 ml-2">
                  <div className="flex flex-col gap-1 max-w-[70%]">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{customer.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      {customer.route && (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-slate-400" /> {customer.route}
                        </span>
                      )}
                      {customer.due > 0 && (
                        <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          Due ₹{customer.due}
                        </span>
                      )}
                    </div>
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
                <div className="flex items-start gap-1 text-xs text-slate-500 mb-4 ml-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> 
                  <span className="line-clamp-2">{customer.address}</span>
                </div>

                <div className="flex gap-4 mb-4 ml-2 bg-slate-50 p-3 rounded-2xl">
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deliver</div>
                    <div className="font-bold text-blue-700 text-lg">{customer.defaultQty} <span className="text-xs font-normal text-slate-500">cans</span></div>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div className="flex-1 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Empties</div>
                    <div className="font-bold text-slate-700 text-lg">{customer.emptyBalance} <span className="text-xs font-normal text-slate-500">cans</span></div>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div className="flex-1 text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Amt</div>
                    <div className="font-bold text-red-600 text-lg">₹{customer.due}</div>
                  </div>
                </div>

                <div className="flex gap-2 ml-2">
                  {delivery.status === 'Pending' ? (
                    <>
                      <button onClick={(e) => handleSkipDelivery(customer.id, e)} className="w-20 bg-orange-100 text-orange-700 font-bold rounded-xl flex items-center justify-center text-xs active:scale-95 transition-transform flex-col gap-0.5 border border-orange-200">
                        <XCircle className="w-4 h-4" /> Skip
                      </button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.95 }} 
                        onClick={(e) => handleRecordDelivery(customer.id, e)} 
                        className={`flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform ${isFirstPending ? 'bg-blue-700 text-white shadow-md shadow-blue-600/20' : 'bg-slate-900 text-white'}`}>
                        <Plus className="w-5 h-5" /> Record Drop
                      </motion.button>
                    </>
                  ) : (
                    <div className="flex-1 bg-slate-100 text-slate-500 font-bold py-3 rounded-xl flex flex-col items-center justify-center text-sm leading-tight border border-slate-200">
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
                      const { sendReminderWhatsApp } = await import('@/lib/whatsappUtils');
                      sendReminderWhatsApp(customer, businessInfo);
                    } catch (e) {
                      alert('Failed to send reminder');
                    }
                  }} className="w-12 bg-green-50 border border-green-200 text-green-600 rounded-xl flex items-center justify-center active:scale-95 transition-transform shrink-0">
                     <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
          )}
        </div>

      </main>

      {/* Floating Next Stop */}
      {activeTab === 'Pending' && !searchQuery && displayList.length > 0 && (
        <div className="fixed bottom-24 right-6 z-40">
          <button onClick={(e) => handleRecordDelivery(displayList[0].customer.id, e)} className="bg-blue-600 text-white font-bold py-4 px-6 rounded-full shadow-lg shadow-blue-600/30 flex items-center gap-2 active:scale-95 transition-transform">
            NEXT STOP <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <BottomNav role="staff" activeTab="customers" />
    </div>
  );
}
