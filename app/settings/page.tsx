'use client';

import { Route, BadgeIndianRupee, Users, User, Bell, Languages, HelpCircle, LogOut, BadgeCheck, ChevronRight, Edit2, X, Camera, MessageCircle, CheckCircle2, Search, ChevronDown, RefreshCcw, Database, AlertCircle, Globe, Calendar, Shield, Building, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { getUnsyncedDeliveries } from '@/lib/idb';
import { updateBusiness } from '@/lib/firestore-service';
import { updateDoc, doc } from 'firebase/firestore';
import { getFirebase } from '@/src/lib/firebase';

const INDIAN_LANGUAGES = [
  'English', 'हिन्दी (Hindi)', 'বাংলা (Bengali)', 'తెలుగు (Telugu)', 
  'मराठी (Marathi)', 'தமிழ் (Tamil)', 'اردو (Urdu)', 
  'ગુજરાતી (Gujarati)', 'ಕನ್ನಡ (Kannada)', 'ଓଡ଼িଆ (Odia)', 
  'മലയാളം (Malayalam)', 'ਪੰਜਾਬੀ (Punjabi)', 'অসমীয়া (Assamese)'
];

const FAQS = [
  {
    id: 1,
    q: "What is Water Delivery Management Software?",
    a: "Water Delivery Management Software is a smart digital solution that helps water suppliers manage customer billing, delivery tracking, empty can return, payment collection, and inventory in one place. It replaces manual registers and simplifies daily operations."
  },
  {
    id: 2,
    q: "How does this water can delivery app work?",
    a: "This water can delivery app allows owners, managers, and staff to add and manage customers, track 20 litre water jar deliveries, monitor empty can returns, record payments and dues, generate invoices, and manage inventory in real-time."
  },
  {
    id: 3,
    q: "Is this software suitable for 20 litre water jar delivery businesses?",
    a: "Yes. This software is specially designed for 20 litre water jar delivery and RO water supply businesses. It helps track jar movement, pending empty cans, and customer billing automatically."
  },
  {
    id: 4,
    q: "Can I track pending payments and dues?",
    a: "Yes. The system automatically calculates customer dues after every delivery and payment. You can view total outstanding amount, customer-wise due, daily collection, and monthly reports."
  },
  {
    id: 5,
    q: "Does this water supplier software support inventory tracking?",
    a: "Yes. It includes a complete water jar inventory tracking system where you can track full cans, empty cans, damaged cans, and manage dispatch and returns."
  },
  {
    id: 6,
    q: "Can I send bills or reminders through WhatsApp?",
    a: "Yes. You can generate PDF bills and send payment reminders directly via WhatsApp. You can also send bulk reminders to customers with pending dues."
  },
  {
    id: 7,
    q: "Is this app suitable for small and medium water supply businesses?",
    a: "Yes. This water delivery business management app is perfect for small local water suppliers, RO water plant operators, multi-route delivery businesses, and growing water distribution companies."
  },
  {
    id: 8,
    q: "Can staff use this water delivery app?",
    a: "Yes. Owners can create staff accounts and assign roles. Staff can update delivery entries, collect payments, and view assigned routes. Managers have higher access while staff access is limited."
  },
  {
    id: 9,
    q: "Is my data secure in this water supply management system?",
    a: "Yes. The system includes secure login, PIN-based authentication, role-based access control, and encrypted data handling to ensure safety."
  },
  {
    id: 10,
    q: "Can I use this water billing software on mobile?",
    a: "Yes. This web-based water billing and delivery software works smoothly on mobile, tablet, and desktop devices."
  }
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function SettingsPage() {
  const router = useRouter();
  const { 
    businessInfo, 
    setBusinessInfo, 
    staff, 
    routes, 
    deliveries,
    currentUser,
    logout,
    authLoading
  } = useAppContext();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const [newName, setNewName] = useState(businessInfo?.ownerName || '');
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editGstNumber, setEditGstNumber] = useState('');

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notificationsEnabled') !== 'false';
    }
    return true;
  });
  
  const [userName, setUserName] = useState<string>('');
  const [pendingSyncs, setPendingSyncs] = useState<any[]>([]);
  const [isSyncLogOpen, setIsSyncLogOpen] = useState(false);

  const fetchPendingSyncs = useCallback(async () => {
    const unsynced = await getUnsyncedDeliveries();
    setPendingSyncs(unsynced);
  }, []);

  useEffect(() => {
    const initFetch = async () => {
      await fetchPendingSyncs();
    };
    initFetch();
    
    // Refresh every 10 seconds while on this page
    const interval = setInterval(fetchPendingSyncs, 10000);
    return () => clearInterval(interval);
  }, [fetchPendingSyncs]);

  useEffect(() => {
    console.log("SettingsPage mounted. Auth state check:");
    console.log("currentUser:", currentUser);
    console.log("businessInfo:", businessInfo);
    
    try {
      if (currentUser) {
        console.log("Attempting to set profile state...");
        requestAnimationFrame(() => {
          try {
            setUserName(currentUser.ownerName || 'User');
            setNewName(currentUser.ownerName || '');
            setEditBusinessName(currentUser.businessName || '');
            setEditPhone(currentUser.phone || '');
            setEditEmail(currentUser.email || '');
            setEditAddress(currentUser.address || '');
            setEditCity(currentUser.city || '');
            setEditState(currentUser.state || '');
            setEditPincode(currentUser.pincode || '');
            setEditGstNumber(currentUser.gstNumber || '');
            setProfileImage(currentUser.profilePhoto || null);
            console.log("Profile state updated successfully.");
          } catch (err) {
            console.error("Error setting profile state:", err);
            console.error((err as Error).stack);
          }
        });
      } else {
        console.warn("currentUser is null or undefined in SettingsPage.");
      }
    } catch (e) {
      console.error("Critical error in SettingsPage useEffect:", e);
      console.error((e as Error).stack);
    }
  }, [currentUser, businessInfo]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        
        // Save base64 photo directly to users/{uid} document!
        const { db } = getFirebase();
        if (db && currentUser) {
          try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
              profilePhoto: base64String,
              updatedAt: new Date().toISOString()
            });
            console.log("Profile Photo updated on Firestore");
          } catch (err) {
            console.error("Failed to save profile photo to Firestore:", err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleNotifications = () => {
    const newVal = !notificationsEnabled;
    setNotificationsEnabled(newVal);
    localStorage.setItem('notificationsEnabled', newVal.toString());
  };

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const filteredFaqs = FAQS.filter(faq => 
    faq.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(faqSearchQuery.toLowerCase())
  );

  const handleSaveProfile = async () => {
    console.log("--- TRACE: handleSaveProfile START ---");
    try {
      console.log("--- TRACE: Current User:", JSON.stringify(currentUser, null, 2));
      if (!currentUser) {
        console.error("--- TRACE FAILURE: No currentUser in handleSaveProfile ---");
        return;
      }
      const { validateName } = await import('@/lib/validation');
      console.log("--- TRACE: Validating Name:", newName);
      const nameVal = validateName(newName);
      if (!nameVal.valid) {
        console.warn("--- TRACE FAILURE: Invalid Name:", nameVal.error);
        alert(nameVal.error || 'Invalid name');
        return;
      }
      
      const cleanName = nameVal.value;
      const { db } = getFirebase();
      if (db) {
        const payload = {
          ownerName: cleanName,
          businessName: editBusinessName,
          phone: editPhone,
          email: editEmail,
          address: editAddress,
          city: editCity,
          state: editState,
          pincode: editPincode,
          gstNumber: editGstNumber,
          updatedAt: new Date().toISOString()
        };
        console.log("--- TRACE: Updating users/" + currentUser.uid + " with Payload:", JSON.stringify(payload, null, 2));
        await updateDoc(doc(db, 'users', currentUser.uid), payload);
        console.log("--- TRACE: Profile Updated SUCCESS. Firestore Path: users/" + currentUser.uid);
      } else {
        console.error("--- TRACE FAILURE: Firestore DB undefined ---");
      }
      console.log("--- TRACE: handleSaveProfile SUCCESS ---");
      setIsEditingProfile(false);
    } catch (e: any) {
      console.error("--- TRACE FAILURE: handleSaveProfile Error ---", e);
      console.error(e.stack);
      alert("Failed to update profile: " + (e.message || e));
    }
  };

  const handleLogout = async () => {
    console.log("Logout Button Clicked");
    console.log("Starting Logout...");
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      console.log("Redirecting to Login");
      router.replace('/login');
      console.log("Logout Complete");
    } catch (e) {
      console.error('Logout failed:', e);
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userRole = currentUser?.role || 'staff';
  console.log("Rendering SettingsPage. currentUser:", currentUser, "businessInfo:", businessInfo);

  if (!businessInfo) {
    console.error("businessInfo is undefined or null!");
    return <div className="p-10">Something went wrong! Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative">
      {isLoggingOut && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 flex flex-col items-center max-w-xs shadow-xl border border-slate-100">
            <RefreshCcw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Signing you out...</h3>
            <p className="text-xs text-slate-400 mt-1 text-center font-sans">Clearing authorization session and resetting cached local profile securely.</p>
          </div>
        </div>
      )}
      <TopAppBar title="Profile" showBack={true} showProfile={false} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Profile Header (Professional App Style) */}
        <div className="flex flex-col items-center mt-2 mb-6 relative">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg flex items-center justify-center relative bg-gradient-to-tr from-blue-100 to-indigo-50">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={profileImage} 
                  alt={`${userRole === 'owner' ? (businessInfo?.ownerName || currentUser?.ownerName || 'Owner') : userName} - Registered Owner/Manager Profile on JalSejiwan`} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-3xl font-bold text-blue-500">
                  {userRole === 'owner' ? (businessInfo?.ownerName || currentUser?.ownerName || 'O').charAt(0).toUpperCase() : (userName || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 outline outline-4 outline-white text-white p-2 rounded-full shadow-lg cursor-pointer active:scale-95 transition-transform hover:bg-blue-700">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          
          <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-xl font-bold text-slate-950 tracking-tight leading-none">
              {currentUser?.ownerName || 'User'}
            </h1>
            
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 capitalize border border-blue-100/50">
              {userRole === 'owner' ? 'Owner' : userRole}
            </div>

            {/* Green Online/Synced badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full border border-emerald-100/60 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online & Synced
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-[18px] border border-slate-100 p-5 mb-6 shadow-sm space-y-4">
          {/* Full Name */}
          <div className="flex items-center gap-3.5 py-1">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {currentUser?.ownerName ? (
                  currentUser.ownerName
                ) : (
                  <span className="text-slate-400 font-normal italic">Not configured</span>
                )}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3.5 py-1">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {currentUser?.email ? (
                  currentUser.email
                ) : (
                  <span className="text-slate-400 font-normal italic">Not configured</span>
                )}
              </p>
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex items-center gap-3.5 py-1">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {currentUser?.phone ? (
                  `+91 ${currentUser.phone}`
                ) : (
                  <span className="text-slate-400 font-normal italic">Not configured</span>
                )}
              </p>
            </div>
          </div>

          {/* Business Name */}
          <div className="flex items-center gap-3.5 py-1">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
              <Building className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Name</p>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {(currentUser?.businessName || businessInfo?.name) ? (
                  currentUser?.businessName || businessInfo?.name
                ) : (
                  <span className="text-slate-400 font-normal italic">Not configured</span>
                )}
              </p>
            </div>
          </div>

          {/* Business ID */}
          <div className="flex items-center gap-3.5 py-1">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business ID</p>
              <p className="text-sm font-mono font-semibold text-slate-800 truncate">
                {currentUser?.businessId ? (
                  currentUser.businessId
                ) : (
                  <span className="text-slate-400 font-normal italic">Not configured</span>
                )}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-3.5 py-1">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</p>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed break-words">
                {currentUser?.address ? (
                  currentUser.address
                ) : (
                  <span className="text-slate-400 font-normal italic">Not configured</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Menus */}
        <div className="bg-white rounded-[18px] border border-slate-100 p-2 shadow-sm space-y-0.5 mb-6">
          {/* Edit Profile */}
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-slate-800 text-sm">Edit Profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Business Settings */}
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-slate-800 text-sm">Business Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Route Management (Conditional on Owner/Manager) */}
          {(userRole === 'owner' || userRole === 'manager') && (
            <Link 
              href="/owner/routes"
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Route className="w-4.5 h-4.5" />
                </div>
                <span className="font-semibold text-slate-800 text-sm">Route Management</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* Price Settings (Conditional on Owner) */}
          {userRole === 'owner' && (
            <Link 
              href="/owner/dashboard/prices"
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BadgeIndianRupee className="w-4.5 h-4.5" />
                </div>
                <span className="font-semibold text-slate-800 text-sm">Price Settings</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* Staff Members (Conditional on Owner/Manager) */}
          {(userRole === 'owner' || userRole === 'manager') && (
            <Link 
              href="/owner/staff"
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <span className="font-semibold text-slate-800 text-sm">Staff Members</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* Notifications */}
          <div className="w-full flex items-center justify-between p-3.5 rounded-xl text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Bell className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-slate-800 text-sm">Notifications</span>
            </div>
            <button 
              onClick={toggleNotifications}
              className={`w-11 h-6 rounded-full relative transition-colors duration-300 ease-in-out cursor-pointer ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ease-in-out ${notificationsEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
            </button>
          </div>

          {/* Language Selection */}
          <button 
            onClick={() => setIsLangModalOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Languages className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-slate-800 text-sm">Language Selection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-600">
                {selectedLanguage.split(' ')[0]}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Offline Sync Log */}
          <button 
            onClick={() => setIsSyncLogOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <RefreshCcw className={`w-4.5 h-4.5 ${pendingSyncs.length > 0 ? 'animate-spin-slow' : ''}`} />
              </div>
              <span className="font-semibold text-slate-800 text-sm">Offline Sync Log</span>
            </div>
            <div className="flex items-center gap-2">
              {pendingSyncs.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                  {pendingSyncs.length}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Help & Support */}
          <button 
            onClick={() => setIsFaqOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-slate-800 text-sm">Help & Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Privacy Policy */}
          <button 
            onClick={() => setIsPrivacyModalOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-slate-800 text-sm">Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* About App */}
          <button 
            onClick={() => setIsAboutModalOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Globe className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-slate-800 text-sm">About App</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Bottom Section - Log Out Button */}
        <div className="pt-2 mb-8">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 hover:bg-red-100 font-bold py-4 rounded-[18px] flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm border border-red-100/30 cursor-pointer text-sm uppercase tracking-wider"
          >
            <LogOut className="w-4.5 h-4.5" /> LOG OUT
          </button>
          
          <div className="mt-6 text-center">
            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">
              JalSejiwan Operations V2.4.0-BUILD88
            </span>
            <span className="text-[7px] text-slate-400 font-semibold mt-1 block uppercase">
              Connected to Production Cloud DB
            </span>
          </div>
        </div>
      </main>

      <BottomNav role={userRole} activeTab="settings" />

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-5 shrink-0">
                <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
                <button onClick={() => setIsEditingProfile(false)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-y-auto pr-1 space-y-4 flex-1 pb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Business Name</label>
                  <input 
                    type="text" 
                    value={editBusinessName}
                    onChange={(e) => setEditBusinessName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    maxLength={10}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Office/Residential Address</label>
                  <textarea 
                    rows={2}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">City / District</label>
                  <input 
                    type="text" 
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">State</label>
                  <select 
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-sm bg-white"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pincode</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">GST Number</label>
                  <input 
                    type="text" 
                    maxLength={15}
                    value={editGstNumber}
                    onChange={(e) => setEditGstNumber(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl active:scale-95 transition-transform text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl active:scale-95 transition-transform text-sm"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Language Selection Modal */}
      <AnimatePresence>
        {isLangModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => setIsLangModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-2 shrink-0">
                <h2 className="text-xl font-bold text-slate-900">Select Language</h2>
                <button onClick={() => setIsLangModalOpen(false)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4 shrink-0">Choose your preferred language for the app interface.</p>
              
              <div className="overflow-y-auto pr-2 space-y-2 flex-1 overscroll-contain pb-4">
                {INDIAN_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setIsLangModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      selectedLanguage === lang 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-medium">{lang}</span>
                    {selectedLanguage === lang && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Help & FAQs Modal */}
      <AnimatePresence>
        {isFaqOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => {
                 setIsFaqOpen(false);
                 setFaqSearchQuery('');
                 setExpandedFaqId(null);
               }}>
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Help & FAQs</h2>
                </div>
                <button 
                  onClick={() => {
                    setIsFaqOpen(false);
                    setFaqSearchQuery('');
                    setExpandedFaqId(null);
                  }} 
                  className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 shrink-0">
                Guides, troubleshooting, and frequently asked questions for Water Delivery Management Software.
              </p>

              {/* Search Bar */}
              <div className="relative mb-4 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Search questions or keywords..."
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800 text-sm"
                />
                {faqSearchQuery && (
                  <button 
                    onClick={() => setFaqSearchQuery('')}
                    className="absolute right-3 top-3 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {/* FAQs List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 overscroll-contain pb-6">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq) => {
                    const isOpen = expandedFaqId === faq.id;
                    return (
                      <div 
                        key={faq.id} 
                        className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                          isOpen 
                            ? 'border-blue-200 bg-blue-50/20' 
                            : 'border-slate-100 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                          className="w-full flex items-start justify-between p-4 text-left transition-colors font-semibold text-slate-800 text-sm gap-2"
                        >
                          <span className="flex-1">{faq.id}. {faq.q}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                        </button>
                        
                        {isOpen && (
                          <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100/50 pt-2 bg-white">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-bounce" />
                    <p className="text-sm font-semibold">No results found</p>
                    <p className="text-xs text-slate-400 mt-1">{"Try searching with other terms like 'reminders', 'dues', or 'water'."}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Offline Sync Log Modal */}
      <AnimatePresence>
        {isSyncLogOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => setIsSyncLogOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <RefreshCcw className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Offline Sync Log</h2>
                </div>
                <button 
                  onClick={() => setIsSyncLogOpen(false)} 
                  className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-6 shrink-0">
                {pendingSyncs.length > 0 
                  ? "The following deliveries were recorded while offline and will be synced automatically when you connect to the internet."
                  : "All your deliveries are successfully synced to the cloud database."}
              </p>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 overscroll-contain pb-6">
                {pendingSyncs.length > 0 ? (
                  pendingSyncs.map((sync) => (
                    <div key={sync.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900">{sync.customerName || `Customer #${sync.customerId}`}</h4>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            {new Date(sync.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <Database className="w-3 h-3" /> PENDING
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Delivered</p>
                          <p className="text-sm font-bold text-blue-600">{sync.deliveredQty}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Empty</p>
                          <p className="text-sm font-bold text-slate-600">{sync.returnedEmpty}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Damaged</p>
                          <p className="text-sm font-bold text-red-600">{sync.damagedQty}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 mt-1">
                        <span className="text-slate-500 font-medium">Payment: <span className="text-slate-900 font-bold">{sync.paymentMode}</span></span>
                        <span className="text-slate-900 font-bold">₹{sync.paymentAmount}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-slate-900">System Synced</h3>
                    <p className="text-xs text-slate-500 mt-1">No pending offline actions found.</p>
                  </div>
                )}
              </div>

              {pendingSyncs.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-2xl flex items-start gap-3 border border-blue-100 shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-900">Auto-sync is active</p>
                    <p className="text-[10px] text-blue-700 leading-relaxed mt-0.5">
                      The app will automatically sync these entries once it detects a stable internet connection. Please keep the app open for a few seconds when you go online.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => setIsPrivacyModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Privacy Policy</h2>
                </div>
                <button onClick={() => setIsPrivacyModalOpen(false)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4 shrink-0">Your privacy is important to us.</p>
              
              <div className="overflow-y-auto pr-2 space-y-4 flex-1 overscroll-contain pb-4 text-xs text-slate-600 leading-relaxed">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">1. Local & Offline Storage</h3>
                  <p>
                    JalSejiwan stores temporary transaction records, customer details, and delivery coordinates locally using IndexedDB. This ensures seamless functionality even without an internet connection.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">2. Cloud Data Storage</h3>
                  <p>
                    When you are online, all logged transaction records, delivery metrics, staff details, and routes are automatically synchronized and safely stored in Google Cloud Firestore database.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">3. Personal & Business Information</h3>
                  <p>
                    We collect your full name, business name, phone number, email address, address, and GST registration purely to generate clean invoice reports, receipts, and maintain secure staff profiles.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">4. Security Measures</h3>
                  <p>
                    Access to your account and records is secured by Google Authentication, standard encryption, and role-based access control rules to prevent unauthorized changes.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* About App Modal */}
      <AnimatePresence>
        {isAboutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => setIsAboutModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">About App</h2>
                </div>
                <button onClick={() => setIsAboutModalOpen(false)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4 shrink-0">Water Delivery Management System</p>
              
              <div className="overflow-y-auto pr-2 space-y-4 flex-1 overscroll-contain pb-4 text-xs text-slate-600 leading-relaxed text-center">
                <div className="py-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-md mb-2">
                    <span className="text-white text-2xl font-black">JS</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">JalSejiwan Operations</h3>
                  <p className="text-[10px] text-slate-400 font-mono">v2.4.0 (Build 88)</p>
                </div>
                
                <div className="text-left bg-slate-50 border border-slate-100 p-3.5 rounded-2xl space-y-2">
                  <p>
                    <strong>JalSejiwan</strong> is a modern, high-performance offline-first water delivery and RO supply management application.
                  </p>
                  <p>
                    <strong>Key Features:</strong>
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>20L Water Can delivery tracking</li>
                    <li>Empty jar collection & deposit records</li>
                    <li>Auto-sync offline IndexedDB log</li>
                    <li>Digital billing and dues tracking</li>
                    <li>Staff accounts & multi-route control</li>
                  </ul>
                </div>
                
                <div className="text-[10px] text-slate-400 font-medium">
                  Designed & Developed with precision.
                  <br />
                  All Rights Reserved © 2026 JalSejiwan.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
