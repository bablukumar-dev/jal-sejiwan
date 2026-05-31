'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { hashPin } from '@/lib/authHelper';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { logActivity } from '@/lib/activityLogger';

export default function AddStaff() {
  const router = useRouter();
  const { staff, setStaff, routes, setRoutes, customers, setCustomers } = useAppContext();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Delivery Partner');
  const [route, setRoute] = useState(routes[0] || '');
  const [pin, setPin] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'manager'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole');
      if (stored === 'owner' || stored === 'manager') return stored as 'owner' | 'manager';
    }
    return 'owner';
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
           alert("Only Owner or Manager can create users");
           return;
        }

        if (!name || !phone || !pin) {
        alert("Please fill all required fields");
        return;
        }
        
        if (pin.length < 4) {
            alert('Password must be at least 4 characters');
            return;
        }

        const creatorId = currentUserRole === 'owner' ? 'owner' : (localStorage.getItem('staffUserId') || 'manager');
        const newStaff = {
        id: Date.now(),
        name,
        phone,
        role,
        route,
        pin: 'HIDDEN', // don't expose raw PIN 
        encryptedPin: hashPin(pin),
        active: true,
        createdBy: creatorId,
        failedPinAttempts: 0
        };

        const currentOwnerId = localStorage.getItem('ownerId') || 'default_owner';
        
        await setDoc(doc(db, 'staff_users', phone.trim()), {
            ...newStaff,
            ownerId: currentOwnerId
        });

        setStaff([...staff, newStaff]);
        
        // Log activity silently in background
        logActivity(
          'staff_created',
          `Added new staff member: ${name} (${role})`,
          { staff_id: newStaff.id, name, role, route }
        );

        alert("Staff Added Successfully!");
        router.push('/owner/staff');
    } catch (err) {
        console.error("Failed to add staff", err);
        alert("Failed to add staff. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Add Staff" showBack={true} />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Full Name *</label>
              <input 
                type="text" 
                className="w-full mt-1 bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                placeholder="Enter staff name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Phone / Email *</label>
              <input 
                type="text" 
                className="w-full mt-1 bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                placeholder="Enter mobile or email"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Role</label>
              <select 
                className="w-full mt-1 bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 appearance-none font-medium text-slate-900"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Delivery Partner">Delivery Partner</option>
                <option value="Manager">Manager</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Assigned Route</label>
              <div className="flex gap-2 mt-1">
                <select 
                  className="flex-1 bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 appearance-none font-medium text-slate-900"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                >
                  <option value="">Select Route...</option>
                  {routes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const newRoutePrompt = prompt('Enter new Route name:');
                    if (newRoutePrompt && newRoutePrompt.trim() !== '') {
                      const newRouteName = newRoutePrompt.trim();
                      if (!routes.includes(newRouteName)) {
                        setRoutes([...routes, newRouteName]);
                      }
                      setRoute(newRouteName);
                    }
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-blue-700 font-bold px-4 rounded-xl text-xs whitespace-nowrap active:scale-95 transition-all shrink-0"
                >
                  + Add
                </button>
                {route && (
                  <button
                    type="button"
                    onClick={() => {
                      const oldRoute = route;
                      const updatedRoutePrompt = prompt(`Rename route "${oldRoute}" to:`, oldRoute);
                      if (updatedRoutePrompt && updatedRoutePrompt.trim() !== '' && updatedRoutePrompt.trim() !== oldRoute) {
                        const newRouteName = updatedRoutePrompt.trim();
                        
                        // 1. Update routes list
                        const updatedRoutes = routes.map(r => r === oldRoute ? newRouteName : r);
                        setRoutes(updatedRoutes);
                        
                        // 2. Update current dropdown selection
                        setRoute(newRouteName);
                        
                        // 3. Update all customers
                        if (customers && setCustomers) {
                          setCustomers(customers.map(c => c.route === oldRoute ? { ...c, route: newRouteName } : c));
                        }
                        
                        // 4. Update all other staff members
                        if (staff && setStaff) {
                          setStaff(staff.map(s => s.route === oldRoute ? { ...s, route: newRouteName } : s));
                        }
                      }
                    }}
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold px-4 rounded-xl text-xs whitespace-nowrap active:scale-95 transition-all shrink-0"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Login Password *</label>
              <input 
                type="text" 
                className="w-full mt-1 bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-lg"
                placeholder="Password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Staff will use this password to log in</p>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            Save Staff Member
          </button>
        </form>
      </main>
      
      <BottomNav role={currentUserRole === 'manager' ? 'manager' : 'owner'} activeTab="settings" />
    </div>
  );
}
