'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { getFirebase } from '@/src/lib/firebase';
import { hashPin } from '@/lib/authHelper';
import { logActivity } from '@/lib/activityLogger';
import { wrapRoute } from '@/lib/permissionGuard';
import { safeGet } from '@/lib/utils';
import { sanitizeString, validateName, validateEmail } from '@/lib/validation';

function AddStaff() {
  const router = useRouter();
  const { staff, setStaff, routes, setRoutes, customers, setCustomers } = useAppContext();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Delivery Partner');
  const [route, setRoute] = useState(routes[0] || '');
  const [pin, setPin] = useState('');
  const [permissions, setPermissions] = useState({
    canCreateStaff: true,
    canDeleteStaff: false,
    canViewReports: true,
    canAccessInventory: false
  });
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'manager'>(() => {
    const stored = safeGet('userRole');
    if (stored === 'owner' || stored === 'manager') return stored as 'owner' | 'manager';
    return 'owner';
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (currentUserRole !== 'owner') {
           alert("Only the Owner is authorized to create accounts.");
           return;
        }

        const nameVal = validateName(name);
        if (!nameVal.valid) {
          alert(`Name Error: ${nameVal.error}`);
          return;
        }

        const emailVal = validateEmail(email);
        if (!emailVal.valid) {
          alert(`Email Error: ${emailVal.error}`);
          return;
        }

        const cleanPin = sanitizeString(pin);
        if (!cleanPin) {
          alert("PIN is required");
          return;
        }

        const pinRegex = /^\d{4,6}$/;
        if (!pinRegex.test(cleanPin)) {
          alert('PIN must be 4 to 6 numeric digits');
          return;
        }

        const creatorId = 'owner';
        const sanitizedRoute = sanitizeString(route);

        const currentOwnerId = safeGet('ownerId');
        const currentBusinessId = safeGet('businessId');
        
        if (!currentBusinessId) {
             throw new Error("Action Blocked: businessId is missing from session.");
        }
        
        const dbRole = role === 'Delivery Partner' ? 'staff' : role.toLowerCase();

        const { auth } = getFirebase();
        if (!auth.currentUser) {
          throw new Error("No authenticated user");
        }
        const idToken = await auth.currentUser.getIdToken();

        // 2. Call the admin API to create the user
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            email: emailVal.value, // Using the email field for identifier
            password: cleanPin,
            name: nameVal.value,
            role: dbRole,
            business_id: currentBusinessId
          })
        });

        const apiResult = await response.json();
        if (!response.ok) {
          throw new Error(apiResult.error || 'Failed to create staff account');
        }

        const newStaff = {
          id: apiResult.userId,
          name: nameVal.value,
          phone: emailVal.value,
          role: sanitizeString(role),
          route: sanitizedRoute,
          pin: 'HIDDEN',
          active: true,
          createdBy: creatorId,
          failedPinAttempts: 0,
          permissions: role === 'Manager' ? permissions : undefined
        };

        setStaff([...staff, newStaff]);
        
        // Log activity silently in background
        logActivity({
          module: 'Organization',
          action: 'Staff Created',
          description: `Added new staff member: ${nameVal.value} (${role})`,
          status: 'success',
          resourceType: 'Staff',
          resourceId: String(newStaff.id),
          resourceName: nameVal.value,
          newValue: newStaff
        });

        alert("Staff Added Successfully!");
        router.push('/owner/staff');
    } catch (err: any) {
        console.error("Failed to add staff", err);
        let msg = "Failed to add staff. Please try again.";
        if (err.message) {
          if (err.message.includes("email-already-in-use") || err.message.toLowerCase().includes("already in use") || err.message.toLowerCase().includes("already exists")) {
            msg = "This email is already registered. Please use another email.";
          } else if (err.message.includes("weak-password") || err.message.toLowerCase().includes("at least 6 characters")) {
            msg = "Password/PIN must be at least 6 characters.";
          } else if (err.message.includes("invalid-email") || err.message.toLowerCase().includes("invalid email")) {
            msg = "Please enter a valid email address.";
          }
        }
        alert(msg);
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
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Email Address *</label>
              <input 
                type="email" 
                className="w-full mt-1 bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                placeholder="Enter staff email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                {currentUserRole === 'owner' && <option value="Manager">Manager</option>}
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
            
            {role === 'Manager' && (
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 block">Manager Permissions</label>
                <div className="space-y-3">
                  {Object.entries(permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setPermissions(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-all flex items-center justify-center">
                          <svg className={`w-3.5 h-3.5 text-white ${value ? 'opacity-100' : 'opacity-0 scale-50'} transition-all`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
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

export default wrapRoute(AddStaff, { requiredRole: 'owner' });
