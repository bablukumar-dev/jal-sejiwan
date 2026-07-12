'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext, Staff } from '@/app/context/AppContext';
import { getFirebase } from '@/src/lib/firebase';
import { hashPin } from '@/lib/authHelper';
import { logActivity } from '@/lib/activityLogger';
import { wrapRoute } from '@/lib/permissionGuard';
import { safeGet } from '@/lib/utils';
import { sanitizeString, validateName, validateEmail } from '@/lib/validation';

function AddStaff() {
  const router = useRouter();
  const { staff, setStaff, routes, setRoutes, customers, setCustomers, currentUser } = useAppContext();
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRouteInput, setNewRouteInput] = useState('');

  // Derive currentUserRole from currentUser or fallback to stored role
  const currentUserRole = currentUser?.role || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : 'owner');

  const handleAddRoute = () => {
    const trimmed = newRouteInput.trim();
    if (trimmed !== '') {
      if (!routes.includes(trimmed)) {
        setRoutes([...routes, trimmed]);
      }
      setRoute(trimmed);
      setNewRouteInput('');
      setIsAddingRoute(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("--- TRACE: AddStaff handleSave START ---");
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    
    try {
        console.log("--- TRACE: Current User:", JSON.stringify(currentUser, null, 2));
        if (currentUser?.role !== 'owner' && currentUser?.role !== 'manager') {
           console.error("--- TRACE FAILURE: Permission Denied for AddStaff ---");
           setErrorMessage("Permission Denied: Only owners/managers can create staff/manager accounts.");
           setIsSubmitting(false);
           return;
        }

        const nameVal = validateName(name);
        if (!nameVal.valid) {
          console.warn("--- TRACE FAILURE: Invalid Name:", nameVal.error);
          setErrorMessage(`Name Error: ${nameVal.error}`);
          setIsSubmitting(false);
          return;
        }

        const emailVal = validateEmail(email);
        if (!emailVal.valid) {
          console.warn("--- TRACE FAILURE: Invalid Email:", emailVal.error);
          setErrorMessage(`Email Error: ${emailVal.error}`);
          setIsSubmitting(false);
          return;
        }

        const cleanPin = sanitizeString(pin);
        if (!cleanPin) {
          console.warn("--- TRACE FAILURE: PIN missing ---");
          setErrorMessage("PIN is required");
          setIsSubmitting(false);
          return;
        }

        if (cleanPin.length < 6) {
          console.warn("--- TRACE FAILURE: PIN too short ---");
          setErrorMessage('Password/PIN must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }

        const currentBusinessId = currentUser?.businessId;
        if (!currentBusinessId) {
             console.error("--- TRACE FAILURE: businessId missing in session ---");
             throw new Error("Action Blocked: businessId is missing from session.");
        }
        
        const dbRole = role === 'Delivery Partner' ? 'staff' : role.toLowerCase();

        const { auth } = getFirebase();
        if (!auth.currentUser) {
          console.error("--- TRACE FAILURE: No authenticated user in SDK ---");
          throw new Error("No authenticated user");
        }
        console.log("--- TRACE: Getting ID Token ---");
        const idToken = await auth.currentUser.getIdToken();

        // 2. Call the admin API to create the user
        console.log("--- TRACE: Calling /api/admin/create-user with Payload ---");
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            email: emailVal.value,
            password: cleanPin,
            name: nameVal.value,
            role: dbRole,
            business_id: currentBusinessId,
            route: route
          })
        });

        const text = await response.text();
        console.log("--- TRACE: API Response Raw:", text);
        let apiResult;
        try {
            apiResult = JSON.parse(text);
        } catch (e) {
            console.error("--- TRACE FAILURE: Failed to parse JSON response ---", text);
            throw new Error("Server returned an invalid response.");
        }
        
        if (!response.ok) {
          console.error("--- TRACE FAILURE: API responded with error:", apiResult.error);
          throw new Error(apiResult.error || 'Failed to create staff account');
        }

        console.log("--- TRACE: API SUCCESS. Result:", JSON.stringify(apiResult, null, 2));

        const newStaffMember: Staff = {
          id: apiResult.userId,
          name: nameVal.value,
          phone: emailVal.value, // Email used as identifier
          role: dbRole,
          route: sanitizeString(route),
          pin: 'HIDDEN',
          active: true,
          createdBy: currentUserRole,
          failedPinAttempts: 0,
          permissions: dbRole === 'manager' ? permissions : undefined,
          businessId: currentBusinessId
        };

        setStaff(prev => [...prev, newStaffMember]);
        
        logActivity({
          module: 'Organization',
          action: 'Staff Created',
          description: `Added new staff member: ${nameVal.value} (${role})`,
          status: 'success',
          resourceType: 'Staff',
          resourceId: String(newStaffMember.id),
          resourceName: nameVal.value,
          newValue: newStaffMember
        });

        console.log("--- TRACE: AddStaff SUCCESS ---");
        setSuccessMessage("Staff Added Successfully!");
        
        setTimeout(() => {
          router.push('/owner/staff');
        }, 2000);

    } catch (err: any) {
        console.error("--- TRACE FAILURE: AddStaff Error ---", err);
        console.error(err.stack);
        let msg = err.message || "Failed to add staff. Please try again.";
        setErrorMessage(msg);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Add Staff" showBack={true} />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSave} className="space-y-6">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {successMessage}
            </div>
          )}
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
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 appearance-none font-medium text-slate-900"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                  >
                    <option value="">Select Route...</option>
                    {routes.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {!isAddingRoute && (
                    <button
                      type="button"
                      onClick={() => setIsAddingRoute(true)}
                      className="bg-slate-200 hover:bg-slate-300 text-blue-700 font-bold px-4 rounded-xl text-xs whitespace-nowrap active:scale-95 transition-all shrink-0"
                    >
                      + Add
                    </button>
                  )}
                </div>
                
                {isAddingRoute && (
                  <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                    <input 
                      type="text"
                      placeholder="Route name"
                      className="flex-1 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-sm"
                      value={newRouteInput}
                      onChange={(e) => setNewRouteInput(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddRoute}
                      className="bg-blue-600 text-white font-bold px-4 rounded-xl text-xs whitespace-nowrap active:scale-95"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingRoute(false)}
                      className="bg-slate-200 text-slate-600 font-bold px-4 rounded-xl text-xs whitespace-nowrap active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
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
              <p className="text-xs text-slate-500 mt-1">Staff will use this password to log in (minimum 6 characters)</p>
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
            disabled={isSubmitting}
            className={`w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-transform ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Saving...' : 'Save Staff Member'}
          </button>
        </form>
      </main>
      
      <BottomNav role={currentUserRole === 'manager' ? 'manager' : 'owner'} activeTab="settings" />
    </div>
  );
}

export default wrapRoute(AddStaff, { requiredPermission: 'create_user' });
