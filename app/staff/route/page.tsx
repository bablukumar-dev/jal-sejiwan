'use client';

import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { MapPin, Phone, Plus, AlertTriangle, ChevronRight, Navigation, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
import { useState } from 'react';

export default function MyRoute() {
  const { deliveries, customers } = useAppContext();
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending');
  const [isOptimized, setIsOptimized] = useState(false);
  
  const today = '2026-03-27';
  const staffId = 1; // Mock logged-in staff ID

  const todaysDeliveries = deliveries.filter(d => d.date === today && d.staffId === staffId);
  const pendingDeliveries = todaysDeliveries.filter(d => d.status === 'Pending');
  const completedDeliveries = todaysDeliveries.filter(d => d.status === 'Delivered' || d.status === 'Skipped');

  if (isOptimized) {
    // Mock optimization by reversing the list or sorting by ID
    pendingDeliveries.sort((a, b) => b.id - a.id); 
  }

  const displayDeliveries = activeTab === 'Pending' ? pendingDeliveries : completedDeliveries;

  const handleOptimize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOptimized(!isOptimized);
    alert(isOptimized ? 'Reverted to original route' : 'Route optimally sorted based on proximity!');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Jal Sejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Task</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Route: Sector 45</h1>
          <p className="text-sm text-slate-600">{pendingDeliveries.length} Drops Remaining • {completedDeliveries.length} Completed Today</p>
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

        {/* Map Placeholder */}
        <div className="bg-slate-300 rounded-3xl h-48 mb-6 relative overflow-hidden border-2 border-slate-200">
          <Image src="https://picsum.photos/seed/map/800/400" alt="Map" fill className="object-cover opacity-50 grayscale" />
          <div className="absolute inset-0 flex items-end p-3">
            <div className="flex gap-2 w-full">
              <button onClick={handleOptimize} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg active:scale-95 transition-transform">
                <Navigation className="w-4 h-4" /> {isOptimized ? 'REVERT ROUTE' : 'OPTIMIZED ROUTE'}
              </button>
              <div className="flex-1 bg-white text-slate-900 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg">
                <MapPin className="w-3 h-3 text-blue-600" /> Sector 45 Main Rd
              </div>
            </div>
          </div>
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center font-bold text-xl">+</button>
            <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center font-bold text-xl">-</button>
          </div>
        </div>

        {/* Route List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {displayDeliveries.map((delivery, index) => {
              const customer = customers.find(c => c.id === delivery.customerId);
              if (!customer) return null;

              const isFirstPending = activeTab === 'Pending' && index === 0;

              return (
                <motion.div 
                  key={delivery.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white rounded-3xl p-5 shadow-sm border ${isFirstPending ? 'border-blue-200 border-l-4 border-l-blue-600' : 'border-slate-100 border-l-4 border-l-slate-300 opacity-70'} relative`}
                >
                  <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-lg flex items-center justify-center font-bold border-2 border-white shadow-sm ${isFirstPending ? 'bg-slate-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {index + 1}
                  </div>
                
                <div className="flex justify-between items-start mb-2 ml-4">
                  <h3 className="font-bold text-slate-900 text-lg">{customer.name}</h3>
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
                  {delivery.status === 'Pending' ? (
                    <>
                      <Link href={`/staff/skip/${delivery.id}`} className="w-20 bg-orange-100 text-orange-700 font-bold rounded-xl flex items-center justify-center text-xs active:scale-95 transition-transform flex-col gap-0.5">
                        <XCircle className="w-4 h-4" /> Skip
                      </Link>
                      <Link href={`/staff/delivery/${delivery.id}`} className={`flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform ${isFirstPending ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        <Plus className="w-5 h-5" /> Record
                      </Link>
                    </>
                  ) : (
                    <div className="flex-1 bg-slate-100 text-slate-500 font-bold py-3 rounded-xl flex flex-col items-center justify-center text-sm leading-tight">
                      <span>{delivery.status}</span>
                      {delivery.status === 'Skipped' && delivery.skipReason && (
                        <span className="text-[10px] text-red-500 mt-0.5">{delivery.skipReason}</span>
                      )}
                    </div>
                  )}
                  <a href={`tel:${customer.phone}`} className="w-12 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center active:scale-95 transition-transform">
                    <Phone className="w-5 h-5" />
                  </a>
                  {delivery.status === 'Pending' && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(customer.address)}`} target="_blank" rel="noopener noreferrer" className="w-12 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center active:scale-95 transition-transform">
                      <MapPin className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>

        {/* Finish Route Banner */}
        {pendingDeliveries.length > 0 && (
          <div className="bg-slate-200 rounded-3xl p-6 mt-8 border border-slate-300 border-dashed text-center">
            <h3 className="font-bold text-slate-900 mb-1">Finish Route?</h3>
            <p className="text-sm text-slate-600 mb-4">You have {pendingDeliveries.length} more stops to complete today&apos;s goal.</p>
            <div className="flex gap-2">
              <button className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-transform">
                Complete Sector 45
              </button>
              <button className="w-12 bg-orange-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Floating Next Stop */}
      {pendingDeliveries.length > 0 && (
        <div className="fixed bottom-24 right-6 z-40">
          <Link href={`/staff/delivery/${pendingDeliveries[0].id}`} className="bg-blue-600 text-white font-bold py-4 px-6 rounded-full shadow-lg shadow-blue-600/30 flex items-center gap-2 active:scale-95 transition-transform">
            NEXT STOP <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      )}

      <BottomNav role="staff" activeTab="route" />
    </div>
  );
}
