'use client';

import { useState } from 'react';
import TopAppBar from '@/components/TopAppBar';
import { User, MapPin, Save, Settings, IndianRupee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';

export default function AddCustomer() {
  const router = useRouter();
  const { areas, setAreas, routes, setRoutes, setCustomers, customers } = useAppContext();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState(areas[0] || '');
  const [route, setRoute] = useState(routes[0] || '');
  const [type, setType] = useState('Home');
  const [deliveryType, setDeliveryType] = useState('Daily');
  const [defaultQty, setDefaultQty] = useState(1);
  const [rate, setRate] = useState(30);
  const [due, setDue] = useState(0);
  const [emptyBalance, setEmptyBalance] = useState(0);
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  const [errors, setErrors] = useState<{name?: string, phone?: string}>({});

  const handleSave = () => {
    try {
        const newErrors: {name?: string, phone?: string} = {};
        if (!name.trim()) newErrors.name = 'Name is required';
        if (!phone.trim()) newErrors.phone = 'Phone is required';
        else if (phone.length < 10) newErrors.phone = 'Mobile must be at least 10 digits';

        if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
        }

        const newId = Math.max(0, ...customers.map(c => c.id)) + 1;
        const newCustomer = {
        id: newId,
        name,
        phone,
        address,
        area,
        route,
        type,
        deliveryType,
        defaultQty,
        rate,
        due,
        emptyBalance,
        active,
        lastDelivery: '',
        notes
        };

        setCustomers([...customers, newCustomer]);
        alert('Customer Successfully Added');
        const role = localStorage.getItem('userRole');
        if (role === 'staff') {
        router.push('/staff/dashboard');
        } else {
        router.push('/owner/customers');
        }
    } catch (e) {
        console.error("Failed to add customer", e);
        alert("Failed to add customer. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <TopAppBar title="Jal Sejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Add Customer</h1>
          <p className="text-slate-500 mt-1">Naya Grahak Jodein</p>
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
                  onChange={(e) => setArea(e.target.value)}
                >
                  <option value="">Select Area...</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const newAreaPrompt = prompt('Enter new Area / Ilaaka name:');
                    if (newAreaPrompt && newAreaPrompt.trim() !== '') {
                      const newAreaName = newAreaPrompt.trim();
                      if (!areas.includes(newAreaName)) {
                        setAreas([...areas, newAreaName]);
                      }
                      setArea(newAreaName);
                    }
                  }}
                  className="bg-slate-200 text-blue-700 px-4 rounded-xl font-bold whitespace-nowrap active:scale-95"
                >+ Add</button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Route</label>
              </div>
              <div className="flex gap-2">
                <select 
                  className="w-full bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 appearance-none font-medium text-slate-900"
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
                  className="bg-slate-200 text-blue-700 px-4 rounded-xl font-bold whitespace-nowrap active:scale-95"
                >+ Add</button>
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

      </main>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-slate-200 z-50">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 text-white rounded-xl py-4 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Save className="w-5 h-5" />
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg leading-none">SAVE CUSTOMER</span>
              <span className="text-[10px] text-blue-200 uppercase tracking-wider mt-1">(Grahak Save Karein)</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
