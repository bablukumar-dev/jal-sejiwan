'use client';

import { useState, useEffect, useRef } from 'react';
import TopAppBar from '@/components/TopAppBar';
import { User, MapPin, Save, Settings, IndianRupee, Camera, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { sanitizeString, validateName, validatePhone, validateAmount, validateQuantity } from '@/lib/validation';
import { logActivity } from '@/lib/activityLogger';
import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ImageCropperModal from '@/components/ImageCropperModal';

export default function AddCustomer() {
  const router = useRouter();
  const { areas, setAreas, routes, setRoutes, setCustomers, customers, staff, setStaff } = useAppContext();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState((areas && areas.length > 0) ? areas[0] : '');
  const [route, setRoute] = useState((routes && routes.length > 0) ? routes[0] : '');
  const [type, setType] = useState('Home');
  const [deliveryType, setDeliveryType] = useState('Daily');
  const [defaultQty, setDefaultQty] = useState(1);
  const [rate, setRate] = useState(30);
  const [due, setDue] = useState(0);
  const [emptyBalance, setEmptyBalance] = useState(0);
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);
  const [deposit, setDeposit] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'None' | 'Monthly' | 'Unlimited' | 'Custom'>('None');
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Low');
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') || '' : '';

  const [errors, setErrors] = useState<{name?: string, phone?: string}>({});

  useEffect(() => {
    // Proactively request camera permission to ensure "Capture" works smoothly
    const checkPermission = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // We don't need a high quality stream here, just any video to trigger prompt
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1, height: 1 } });
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.warn("Camera permission not granted yet or not available:", err);
      }
    };
    checkPermission();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setTempImage(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  const handleSave = async () => {
    try {
        const newErrors: {name?: string, phone?: string} = {};
        
        // Use our sanitization / validation layer
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

        const customersArray = Array.isArray(customers) ? customers : [];
        const newId = Math.max(0, ...customersArray.map(c => c.id || 0), 0) + 1;
        const currentBusinessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') || 'default_business' : 'default_business';
        
        let uploadedImageURL = '';
        if (selectedImage) {
          try {
            setIsUploading(true);
            const imageRef = ref(storage, `customers/${currentBusinessId}_${newId}/profile.jpg`);
            await uploadBytes(imageRef, selectedImage);
            uploadedImageURL = await getDownloadURL(imageRef);
          } catch (uploadError) {
            console.error("Firebase Storage upload error:", uploadError);
            alert("Image upload failed, but customer will be saved without an image.");
          } finally {
            setIsUploading(false);
          }
        }

        const newCustomer = {
          id: newId,
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
          lastDelivery: '',
          notes: sanitizedNotes,
          deposit: depositVal.value,
          walletBalance: walletBalanceVal.value,
          subscriptionPlan,
          riskLevel,
          businessId: currentBusinessId,
          imageURL: uploadedImageURL
        };

        setCustomers([...customersArray, newCustomer]);
        
        logActivity(
          'customer_added',
          `Added new customer: ${nameVal.value} (${type}) with default quantity ${defaultQtyVal.value} and rate ₹${rateVal.value}`,
          {
            customer_id: newId,
            name: nameVal.value,
            phone: phoneVal.value,
            route: sanitizedRoute,
            area: sanitizedArea,
            type,
            rate: rateVal.value,
            defaultQty: defaultQtyVal.value,
            imageURL: uploadedImageURL
          }
        );

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
      <TopAppBar title="JalSejiwan" showBack={true} />

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
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Customer Image / Grahak Ya Dukaan Ki Photo</label>
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                {imagePreview ? (
                  <img src={imagePreview} className="w-16 h-16 rounded-full object-cover border border-slate-200" alt="Preview" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <Camera className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex gap-2">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 inline-block">
                      {isUploading ? 'Uploading...' : 'Choose Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setTempImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" />
                      Capture
                    </button>
                  </div>
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
                  onChange={(e) => setArea(e.target.value)}
                >
                  <option value="">Select Area...</option>
                  {Array.isArray(areas) && areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const newAreaPrompt = prompt('Enter new Area / Ilaaka name:');
                    if (newAreaPrompt && newAreaPrompt.trim() !== '') {
                      const newAreaName = newAreaPrompt.trim();
                      const areasArr = Array.isArray(areas) ? areas : [];
                      if (!areasArr.includes(newAreaName)) {
                        setAreas([...areasArr, newAreaName]);
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
            {(userRole === 'owner' || userRole === 'manager') && (
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
            )}

            {(userRole === 'owner' || userRole === 'manager') && (
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
            )}
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

        {tempImage && (
          <ImageCropperModal
            image={tempImage}
            onConfirm={(file) => {
              setSelectedImage(file);
              setImagePreview(URL.createObjectURL(file));
              setTempImage(null);
            }}
            onClose={() => setTempImage(null)}
          />
        )}

        {showCamera && (
          <div className="fixed inset-0 bg-black z-[100] flex flex-col">
            <div className="p-4 flex justify-between items-center bg-black/50 text-white">
              <h3 className="font-bold">Capture Photo</h3>
              <button onClick={stopCamera} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="p-8 flex justify-center bg-black/50">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center active:scale-90 transition-transform border-4 border-slate-300"
              >
                <div className="w-12 h-12 rounded-full border-2 border-slate-900" />
              </button>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-slate-200 z-50">
        <div className="max-w-md mx-auto">
          <button
            type="button"
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
