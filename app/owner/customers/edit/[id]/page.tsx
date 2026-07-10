'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import TopAppBar from '@/components/TopAppBar';
import { User, MapPin, Save, Settings, IndianRupee, Camera, Trash2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { sanitizeString, validateName, validatePhone, validateAmount, validateQuantity } from '@/lib/validation';
import { logActivity } from '@/lib/activityLogger';
import { updateCustomer } from '@/lib/firestore-service';

export default function EditCustomer() {
  const router = useRouter();
  const params = useParams();
  const { areas, setAreas, routes, setRoutes, setCustomers, customers, staff, setStaff, currentUser } = useAppContext();

  const customerId = params.id as string;
  const customer = customers.find(c => c.id === customerId);

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [area, setArea] = useState(customer?.area || '');
  const [route, setRoute] = useState(customer?.route || '');
  const [type, setType] = useState(customer?.type || 'Home');
  const [deliveryType, setDeliveryType] = useState(customer?.deliveryType || 'Daily');
  const [defaultQty, setDefaultQty] = useState(customer?.defaultQty || 1);
  const [rate, setRate] = useState(customer?.rate || 30);
  const [due, setDue] = useState(customer?.due || 0);
  const [emptyBalance, setEmptyBalance] = useState(customer?.emptyBalance || 0);
  const [notes, setNotes] = useState(customer?.notes || '');
  const [active, setActive] = useState(customer?.active ?? true);
  const [deposit, setDeposit] = useState(customer?.deposit || 0);
  const [walletBalance, setWalletBalance] = useState(customer?.walletBalance || 0);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'None' | 'Monthly' | 'Unlimited' | 'Custom'>(customer?.subscriptionPlan || 'None');
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>(customer?.riskLevel || 'Low');

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(customer?.imageURL || null);
  const [isUploading, setIsUploading] = useState(false);

  const [errors, setErrors] = useState<{name?: string, phone?: string}>({});

  if (!customer) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Customer not found</div>;
  }

  const handleSave = async () => {
    try {
        const newErrors: {name?: string, phone?: string} = {};
        
        // Input validation checks via central layer
        const nameVal = validateName(name);
        const phoneVal = validatePhone(phone);
        const rateVal = validateAmount(rate, true, 10000);
        const dueVal = validateAmount(due, true, 1000000);
        const defaultQtyVal = validateQuantity(defaultQty, false, 500);
        const emptyBalanceVal = validateQuantity(emptyBalance, true, 5000);
        const depositVal = validateAmount(deposit, true, 1000000);
        const walletBalanceVal = validateAmount(walletBalance, true, 1000000);

        if (!nameVal.valid) {
          newErrors.name = nameVal.error || 'Invalid name';
        }
        if (!phoneVal.valid) {
          newErrors.phone = phoneVal.error || 'Invalid phone pattern';
        }

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
        }

        const sanitizedAddress = sanitizeString(address);
        const sanitizedNotes = sanitizeString(notes);
        const sanitizedArea = sanitizeString(area);
        const sanitizedRoute = sanitizeString(route);

        const currentBusinessId = customer?.businessId || currentUser?.businessId;
        
        let uploadedImageURL = customer?.imageURL || '';
        if (selectedImage) {
            uploadedImageURL = URL.createObjectURL(selectedImage);
        } else if (imagePreview === null) {
          uploadedImageURL = '';
        }

        const updatedCustomerData = {
          name: nameVal.value,
          phone: phoneVal.value,
          address: sanitizedAddress,
          area: sanitizedArea,
          route: sanitizedRoute,
          type,
          deliveryType,
          defaultQty: defaultQtyVal.value,
          rate: rateVal.value,
          due: dueVal.value,
          emptyBalance: emptyBalanceVal.value,
          active,
          notes: sanitizedNotes,
          deposit: depositVal.value,
          walletBalance: walletBalanceVal.value,
          subscriptionPlan,
          riskLevel,
          imageURL: uploadedImageURL
        };

        if (!currentUser) return;
        await updateCustomer(customerId, updatedCustomerData, currentUser);

        logActivity({
          module: 'Customers',
          action: 'Customer Edited',
          description: `Edited customer ${nameVal.value} (${type}): Rate updated to ₹${rateVal.value}, default qty ${defaultQtyVal.value}`,
          status: 'success',
          resourceType: 'Customer',
          resourceId: String(customerId),
          resourceName: nameVal.value,
          newValue: updatedCustomerData
        });

        alert('Customer Successfully Updated');
        router.push(`/owner/customers/${customerId}`);
    } catch (e) {
        console.error("Failed to update customer", e);
        alert("Failed to update customer. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      if (!currentUser) return;
      if (currentUser.role !== 'owner') {
        alert("Only owners are permitted to delete customer profiles.");
        return;
      }

      const confirmText = `Are you sure you want to permanently delete customer "${customer?.name}"?\nThis action is irreversible and will delete their document from the database.`;
      if (!confirm(confirmText)) return;

      const { deleteWithAudit } = await import('@/lib/firestore-service');
      await deleteWithAudit('customers', customerId, currentUser);

      await logActivity({
        module: 'Customers',
        action: 'Customer Deleted',
        description: `Permanently deleted customer: ${name} (ID: ${customerId})`,
        status: 'success',
        resourceType: 'Customer',
        resourceId: String(customerId),
        resourceName: name
      }).catch(err => console.error("Activity logging failed during deletion:", err));

      alert('Customer successfully deleted.');
      router.push('/owner/customers');
    } catch (e: any) {
      console.error("Failed to delete customer", e);
      alert(`Deletion Failed: ${e.message || 'Please try again.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <TopAppBar title="JalSejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Edit Customer</h1>
          <p className="text-slate-500 mt-1">Grahak Ki Jankari Badlein</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grahak Ki Jankari</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Customer Name</label>
              <input 
                type="text" 
                placeholder="e.g. Rahul Sharma" 
                className={`w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 ${errors.name ? 'ring-2 ring-red-500' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Phone Number</label>
              <div className={`flex bg-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 ${errors.phone ? 'ring-2 ring-red-500' : ''}`}>
                <span className="px-4 py-3 text-slate-900 font-medium border-r border-slate-200">+91</span>
                <input 
                  type="tel" 
                  placeholder="9876543210" 
                  className="w-full bg-transparent px-4 py-3 outline-none font-medium text-slate-900 placeholder:text-slate-400"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Customer Image / Grahak Ya Dukaan Ki Photo</label>
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                {imagePreview ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 relative">
                    <Image 
                      src={imagePreview} 
                      alt="Preview" 
                      fill 
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <Camera className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95">
                    {isUploading ? 'Uploading...' : 'Choose Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedImage(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImagePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="ml-3 text-xs text-red-500 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">Upload a shop/house or profile photo.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery Details</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Area / Ilaaka</label>
              </div>
              <div className="flex gap-2">
                <select 
                  className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 appearance-none font-medium text-slate-900"
                  value={area}
                  onChange={(e) => {
                    if (e.target.value === 'add_new') {
                      const newAreaPrompt = prompt('Enter new Area / Ilaaka name:');
                      if (newAreaPrompt && newAreaPrompt.trim() !== '') {
                        const newAreaName = newAreaPrompt.trim();
                        if (!areas.includes(newAreaName)) {
                          setAreas([...areas, newAreaName]);
                        }
                        setArea(newAreaName);
                      }
                    } else {
                      setArea(e.target.value);
                    }
                  }}
                >
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  <option value="add_new" className="text-blue-600 font-bold">+ Add New Area</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Route</label>
              </div>
              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 appearance-none font-medium text-slate-900"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                >
                  <option value="">Select Route...</option>
                  {Array.isArray(routes) && routes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const newRoutePrompt = prompt('Enter new Route name:');
                    if (newRoutePrompt && newRoutePrompt.trim() !== '') {
                      const newRouteName = newRoutePrompt.trim();
                      const routesArr = Array.isArray(routes) ? routes : [];
                      if (!routesArr.includes(newRouteName)) {
                        setRoutes([...routesArr, newRouteName]);
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
                        const routesArr = Array.isArray(routes) ? routes : [];
                        const updatedRoutes = routesArr.map(r => r === oldRoute ? newRouteName : r);
                        setRoutes(updatedRoutes);
                        
                        // 2. Update dropdown selected value
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
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Full Address / Pura Pata</label>
              <textarea 
                placeholder="House No, Floor, Landmark..." 
                rows={3}
                className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 resize-none font-medium text-slate-900"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preferences</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Type</label>
              <div className="flex gap-2">
                {['Home', 'Shop', 'Office'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${type === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Delivery Type</label>
              <div className="flex gap-2">
                {['Daily', 'Alternate', 'On-demand'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setDeliveryType(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${deliveryType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Default Qty</label>
                <div className="flex bg-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600">
                  <button onClick={() => setDefaultQty(Math.max(1, defaultQty - 1))} className="px-4 py-3 text-slate-600 font-bold hover:bg-slate-200">-</button>
                  <input 
                    type="number" 
                    className="w-full bg-transparent px-2 py-3 outline-none font-medium text-slate-900 text-center"
                    value={defaultQty}
                    onChange={(e) => setDefaultQty(parseInt(e.target.value) || 0)}
                  />
                  <button onClick={() => setDefaultQty(defaultQty + 1)} className="px-4 py-3 text-slate-600 font-bold hover:bg-slate-200">+</button>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Rate (₹)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  value={rate}
                  onChange={(e) => setRate(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee className="w-5 h-5 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opening Balances</h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Opening Due</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  value={due}
                  onChange={(e) => setDue(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Empty Balance</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  value={emptyBalance}
                  onChange={(e) => setEmptyBalance(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Enterprise Fields */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Security Deposit</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  value={deposit}
                  onChange={(e) => setDeposit(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Wallet Balance</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  value={walletBalance}
                  onChange={(e) => setWalletBalance(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Subscription Map</label>
                <select 
                  className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 appearance-none font-medium text-slate-900"
                  value={subscriptionPlan}
                  onChange={(e) => setSubscriptionPlan(e.target.value as any)}
                >
                  <option value="None">None</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Unlimited">Unlimited</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Risk Level</label>
                <select 
                  className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 appearance-none font-medium text-slate-900"
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as any)}
                >
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Notes</label>
              <textarea 
                placeholder="Any special instructions..." 
                rows={2}
                className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 resize-none font-medium text-slate-900"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="text-sm font-bold text-slate-900">Active Customer</label>
              <button 
                onClick={() => setActive(!active)}
                className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${active ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {currentUser?.role === 'owner' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Trash2 className="w-5 h-5 text-red-600" />
              <h2 className="text-xs font-bold text-red-600 uppercase tracking-wider">Danger Zone (Khatarnak Kshetra)</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">Permanently delete this customer record and all opening balances. This action is irreversible.</p>
            <button 
              type="button"
              onClick={handleDelete}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform border border-red-200"
            >
              <Trash2 className="w-4 h-4" /> Delete Customer Profile
            </button>
          </div>
        )}

      </main>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-slate-200 z-50">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 text-white rounded-xl py-4 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Save className="w-5 h-5" />
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg leading-none">SAVE CHANGES</span>
              <span className="text-[10px] text-blue-200 uppercase tracking-wider mt-1">(Badlav Save Karein)</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
