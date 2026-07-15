'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Droplets, 
  ShieldCheck, 
  Bell, 
  UserPlus, 
  CheckCircle2, 
  Lock,
  Globe,
  FileText,
  Loader2
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { getFirebase } from '@/src/lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { setCookie } from '@/lib/authHelper';
import { logActivity } from '@/lib/activityLogger';

// --- ZOD SCHEMAS FOR VALIDATION ---

// Owner validation schemas
const ownerOrgSchema = z.object({
  orgName: z.string().min(2, { message: "Organization Name must be at least 2 characters" }),
  state: z.string().min(1, { message: "Please select a State" }),
  district: z.string().min(2, { message: "District name must be at least 2 characters" }),
  officeAddress: z.string().min(5, { message: "Office Address must be at least 5 characters" }),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, { message: "Please enter a valid 10-digit Indian phone number" }),
});

const managerProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().regex(/^[6-9]\d{9}$/, { message: "Please enter a valid 10-digit Indian phone number" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
});

const managerAreaSchema = z.object({
  assignedArea: z.string().min(2, { message: "Assigned Area/District is required" }),
  verified: z.boolean().refine(val => val === true, { 
    message: "You must verify your assigned area to proceed" 
  }),
});

// Staff validation schemas
const staffProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().regex(/^[6-9]\d{9}$/, { message: "Please enter a valid 10-digit Indian phone number" }),
});

const staffTermsSchema = z.object({
  acceptedTerms: z.boolean().refine(val => val === true, { 
    message: "You must accept the Terms of Service to proceed" 
  }),
});

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, setBusinessInfo } = useAppContext();
  
  const [currentStep, setCurrentStep] = useState(1);
  const role = currentUser?.role || null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // --- FORM STATES ---
  // Owner Forms
  const [ownerOrg, setOwnerOrg] = useState({
    orgName: '',
    state: '',
    district: '',
    officeAddress: '',
    contactNumber: ''
  });

  const [ownerNotify, setOwnerNotify] = useState({
    whatsappEnabled: true,
    autoReminders: false,
    reminderDay: 5
  });

  // Manager Forms
  const [managerProfile, setManagerProfile] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const [managerArea, setManagerArea] = useState({
    assignedArea: '',
    verified: false
  });

  const [managerNotify, setManagerNotify] = useState({
    dailyReports: true,
    criticalAlerts: true
  });

  // Staff Forms
  const [staffProfile, setStaffProfile] = useState({
    name: '',
    phone: ''
  });

  const [staffLang, setStaffLang] = useState('English');
  const [staffTerms, setStaffTerms] = useState({
    acceptedTerms: false
  });

  useEffect(() => {
    if (currentUser) {
      requestAnimationFrame(() => {
        // Prefill names if they exist on the user object
        if (currentUser.role === 'owner') {
          setOwnerOrg(prev => ({
            ...prev,
            contactNumber: prev.contactNumber
          }));
        } else if (currentUser.role === 'manager') {
          setManagerProfile(prev => ({
            ...prev,
            name: prev.name
          }));
        } else if (currentUser.role === 'staff') {
          setStaffProfile(prev => ({
            ...prev,
            name: prev.name
          }));
        }
      });
    }
  }, [currentUser]);

  if (!currentUser || !role) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-800">Setting up onboarding environment...</h2>
        <p className="text-xs text-slate-400 mt-1">Authenticating session credentials</p>
      </div>
    );
  }

  // Calculate total steps based on role
  const totalSteps = role === 'owner' ? 4 : role === 'manager' ? 4 : 2;

  const handleNext = async () => {
    setValidationErrors({});
    setGeneralError(null);

    // Validate the current step
    if (role === 'owner') {
      if (currentStep === 1) {
        const result = ownerOrgSchema.safeParse(ownerOrg);
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            errors[String(issue.path[0])] = issue.message;
          });
          setValidationErrors(errors);
          return;
        }
      }
    } else if (role === 'manager') {
      if (currentStep === 1) {
        const result = managerProfileSchema.safeParse(managerProfile);
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            errors[String(issue.path[0])] = issue.message;
          });
          setValidationErrors(errors);
          return;
        }
      } else if (currentStep === 2) {
        const result = managerAreaSchema.safeParse(managerArea);
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            errors[String(issue.path[0])] = issue.message;
          });
          setValidationErrors(errors);
          return;
        }
      }
    } else if (role === 'staff') {
      if (currentStep === 1) {
        const result = staffProfileSchema.safeParse(staffProfile);
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            errors[String(issue.path[0])] = issue.message;
          });
          setValidationErrors(errors);
          return;
        }
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      await handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const { db, auth } = getFirebase();
      if (!db || !auth.currentUser) throw new Error("Firebase is not initialized");

      const userDocRef = doc(db, 'users', currentUser.uid);

      if (role === 'owner') {
        const bId = currentUser.businessId;
        const oId = currentUser.uid;

        // 1. Create Business Document
        const businessDocRef = doc(db, 'businesses', bId);
        const businessData = {
          name: ownerOrg.orgName,
          ownerId: oId,
          businessId: bId,
          userId: oId,
          address: ownerOrg.officeAddress,
          phone: ownerOrg.contactNumber,
          state: ownerOrg.state,
          district: ownerOrg.district,
          defaultRate: 45,
          whatsappConfig: {
            enabled: ownerNotify.whatsappEnabled,
            useApi: false,
            reminderDay: ownerNotify.reminderDay,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(businessDocRef, businessData);

        // 2. Initialize Inventory for this business inside the settings subcollection
        const inventoryDocRef = doc(db, 'businesses', bId, 'settings', 'inventory');
        await setDoc(inventoryDocRef, {
          fullCans: 0,
          emptyCans: 0,
          damagedCans: 0,
          cansWithCustomers: 0,
          cansInDelivery: 0,
          refillInProcess: 0,
          businessId: bId,
          ownerId: oId,
          userId: oId,
          updatedAt: new Date().toISOString(),
        });

        // 3. Update User Document (Single Source of Truth)
        await setDoc(userDocRef, {
          onboardingCompleted: true,
          profileCompleted: true,
          updatedAt: new Date().toISOString(),
          businessName: ownerOrg.orgName,
          address: ownerOrg.officeAddress,
          phone: ownerOrg.contactNumber,
          state: ownerOrg.state,
          city: ownerOrg.district,
          ownerName: currentUser.ownerName || auth.currentUser.displayName || 'Owner',
          pincode: '',
          gstNumber: '',
          email: auth.currentUser.email || '',
        }, { merge: true });
        console.log("Onboarding Save Success. Firestore Path: users/" + currentUser.uid);

        // Update local context/state
        setBusinessInfo(businessData as any);
        localStorage.setItem('businessInfo', JSON.stringify(businessData));
        localStorage.setItem('businessId', bId);

        // Activity Log
        logActivity({
          module: 'System',
          action: 'Business Onboarding',
          description: `Business onboarding completed: ${ownerOrg.orgName}`,
          status: 'success',
          businessId: bId
        });
        
        // Reload from Firestore is handled by onSnapshot in AppContext

      } else if (role === 'manager') {
        const bId = currentUser?.businessId;
        if (!bId) throw new Error("Missing businessId in user context");

        const managerData = {
          onboardingCompleted: true,
          profileCompleted: true,
          updatedAt: new Date().toISOString(),
          ownerName: managerProfile.name,
          phone: managerProfile.phone,
          address: managerProfile.address,
          assignedArea: managerArea.assignedArea,
          notifyDailyReports: managerNotify.dailyReports,
          notifyCriticalAlerts: managerNotify.criticalAlerts,
          email: auth.currentUser?.email || '',
        };

        // Update Firestore Document for Manager (User)
        await setDoc(userDocRef, managerData, { merge: true });
        console.log("Onboarding Save Success. Firestore Path: users/" + currentUser.uid);

        // Activity Log
        logActivity({
          module: 'System',
          action: 'Manager Onboarding',
          description: `Manager profile onboarding completed for ${managerProfile.name}`,
          status: 'success',
          businessId: bId
        });

        // Also update staff subcollection document
        const staffDocRef = doc(db, 'businesses', bId, 'staff', currentUser.uid);
        await setDoc(staffDocRef, {
          name: managerProfile.name,
          phone: managerProfile.phone,
          onboardingCompleted: true,
          profileCompleted: true,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => console.warn("Staff document update skipped or failed:", err));

      } else if (role === 'staff') {
        const bId = currentUser?.businessId;
        if (!bId) throw new Error("Missing businessId in user context");

        const staffData = {
          onboardingCompleted: true,
          profileCompleted: true,
          updatedAt: new Date().toISOString(),
          ownerName: staffProfile.name,
          phone: staffProfile.phone,
          email: auth.currentUser?.email || '',
        };

        // Update Firestore Document for Staff (User)
        await setDoc(userDocRef, staffData, { merge: true });
        console.log("Onboarding Save Success. Firestore Path: users/" + currentUser.uid);

        // Activity Log
        logActivity({
          module: 'System',
          action: 'Staff Onboarding',
          description: `Staff profile onboarding completed for ${staffProfile.name}`,
          status: 'success',
          businessId: bId
        });

        // Also update staff subcollection document
        const staffDocRef = doc(db, 'businesses', bId, 'staff', currentUser.uid);
        await setDoc(staffDocRef, {
          name: staffProfile.name,
          phone: staffProfile.phone,
          onboardingCompleted: true,
          profileCompleted: true,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => console.warn("Staff document update skipped or failed:", err));
      }

      // Synchronize Cookie immediately so middleware lets them in
      setCookie('onboardingCompleted', 'true', 3600);

      // Route based on role
      router.replace(role === 'staff' ? '/staff/dashboard' : '/owner/dashboard');
    } catch (err: any) {
      console.error("Onboarding submission error:", err);
      setGeneralError(err.message || "Something went wrong during onboarding submission. Please try again.");
      setIsSubmitting(false);
    }
  };

  const getStepIcon = (step: number) => {
    if (role === 'owner') {
      switch (step) {
        case 1: return <Building2 className="w-5 h-5" />;
        case 2: return <Bell className="w-5 h-5" />;
        case 3: return <FileText className="w-5 h-5" />;
        case 4: return <CheckCircle2 className="w-5 h-5" />;
        default: return <ChevronRight className="w-5 h-5" />;
      }
    } else if (role === 'manager') {
      switch (step) {
        case 1: return <User className="w-5 h-5" />;
        case 2: return <MapPin className="w-5 h-5" />;
        case 3: return <Bell className="w-5 h-5" />;
        case 4: return <CheckCircle2 className="w-5 h-5" />;
        default: return <ChevronRight className="w-5 h-5" />;
      }
    } else {
      switch (step) {
        case 1: return <User className="w-5 h-5" />;
        case 2: return <CheckCircle2 className="w-5 h-5" />;
        default: return <ChevronRight className="w-5 h-5" />;
      }
    }
  };

  const getStepTitle = (step: number) => {
    if (role === 'owner') {
      switch (step) {
        case 1: return "Organization Info";
        case 2: return "Notification Setup";
        case 3: return "Review & Confirm";
        case 4: return "All Done!";
        default: return "";
      }
    } else if (role === 'manager') {
      switch (step) {
        case 1: return "Complete Profile";
        case 2: return "Verify Area";
        case 3: return "Alert Preferences";
        case 4: return "Ready to Launch!";
        default: return "";
      }
    } else {
      switch (step) {
        case 1: return "Partner Profile";
        case 2: return "Ready to Deliver!";
        default: return "";
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div id="onboarding-card" className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Banner/Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-white relative">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <Droplets className="w-8 h-8 text-blue-200 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-blue-100">Smart Water Management</p>
              <h1 className="text-2xl font-bold font-sans">JalSeJiwan Onboarding</h1>
            </div>
          </div>
          
          {/* Step Indicator Bullets */}
          <div className="mt-8 flex items-center space-x-2">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentStep === idx + 1 
                    ? 'w-8 bg-white' 
                    : currentStep > idx + 1 
                      ? 'w-2.5 bg-blue-300' 
                      : 'w-2.5 bg-blue-900/30'
                }`}
              />
            ))}
            <span className="text-xs font-medium text-blue-100 ml-auto">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="p-8 sm:p-10">
          
          {generalError && (
            <div id="error-banner" className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-700 text-sm">
              <span className="font-bold">⚠️</span>
              <div>
                <p className="font-semibold text-red-800">Unable to Proceed</p>
                <p className="text-xs text-red-600 mt-0.5">{generalError}</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  {getStepIcon(currentStep)}
                </div>
                <h2 className="text-xl font-bold text-slate-800">{getStepTitle(currentStep)}</h2>
              </div>

              {/* --- ROLE: OWNER FLOWS --- */}
              {role === 'owner' && (
                <>
                  {/* Step 1: Org Info */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">Please provide the details of your official water distribution organization.</p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Organization / Enterprise Name *</label>
                          <input 
                            type="text"
                            placeholder="e.g. Swajal Water Supply"
                            value={ownerOrg.orgName}
                            onChange={e => setOwnerOrg({...ownerOrg, orgName: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.orgName ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                          />
                          {validationErrors.orgName && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.orgName}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">State *</label>
                            <select 
                              value={ownerOrg.state}
                              onChange={e => setOwnerOrg({...ownerOrg, state: e.target.value})}
                              className={`w-full px-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white ${validationErrors.state ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                            >
                              <option value="">Select State</option>
                              {INDIAN_STATES.map((state, i) => (
                                <option key={i} value={state}>{state}</option>
                              ))}
                            </select>
                            {validationErrors.state && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.state}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">District / Region *</label>
                            <input 
                              type="text"
                              placeholder="e.g. Pune"
                              value={ownerOrg.district}
                              onChange={e => setOwnerOrg({...ownerOrg, district: e.target.value})}
                              className={`w-full px-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.district ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                            />
                            {validationErrors.district && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.district}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Office Address *</label>
                          <textarea 
                            rows={3}
                            placeholder="e.g. Plot No 12, Main Bazaar Road, near Panchayat Office"
                            value={ownerOrg.officeAddress}
                            onChange={e => setOwnerOrg({...ownerOrg, officeAddress: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.officeAddress ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                          />
                          {validationErrors.officeAddress && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.officeAddress}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Official Contact Number *</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">+91</span>
                            <input 
                              type="text"
                              maxLength={10}
                              placeholder="9876543210"
                              value={ownerOrg.contactNumber}
                              onChange={e => setOwnerOrg({...ownerOrg, contactNumber: e.target.value.replace(/\D/g, '')})}
                              className={`w-full pl-14 pr-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.contactNumber ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                            />
                          </div>
                          {validationErrors.contactNumber && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.contactNumber}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Notification Setup */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">Configure your automated alert configurations. These trigger communication loops for your registered consumers.</p>
                      
                      <div className="space-y-5">
                        <div className="flex items-start space-x-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <input 
                            type="checkbox"
                            id="whatsappEnabled"
                            checked={ownerNotify.whatsappEnabled}
                            onChange={e => setOwnerNotify({...ownerNotify, whatsappEnabled: e.target.checked})}
                            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 outline-none border-slate-300"
                          />
                          <label htmlFor="whatsappEnabled" className="select-none">
                            <p className="text-sm font-semibold text-slate-800">Enable WhatsApp Notifications</p>
                            <p className="text-xs text-slate-500 mt-0.5">Send auto-receipts and delivery confirmations directly to consumers on WhatsApp.</p>
                          </label>
                        </div>

                        <div className="flex items-start space-x-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <input 
                            type="checkbox"
                            id="autoReminders"
                            checked={ownerNotify.autoReminders}
                            onChange={e => setOwnerNotify({...ownerNotify, autoReminders: e.target.checked})}
                            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 outline-none border-slate-300"
                          />
                          <label htmlFor="autoReminders" className="select-none">
                            <p className="text-sm font-semibold text-slate-800">Enable Automated Monthly Bill Reminders</p>
                            <p className="text-xs text-slate-500 mt-0.5">Automate payment reminder messages for pending household due balances.</p>
                          </label>
                        </div>

                        {ownerNotify.autoReminders && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 bg-blue-50/50 rounded-2xl border border-blue-50 space-y-2"
                          >
                            <label className="block text-xs font-bold text-slate-600 uppercase">Monthly Alert Dispatch Day</label>
                            <select 
                              value={ownerNotify.reminderDay}
                              onChange={e => setOwnerNotify({...ownerNotify, reminderDay: Number(e.target.value)})}
                              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm outline-none"
                            >
                              {Array.from({ length: 28 }).map((_, idx) => (
                                <option key={idx} value={idx + 1}>{idx + 1}st / {idx + 1}th of each month</option>
                              ))}
                            </select>
                            <p className="text-xs text-slate-400 mt-1">Payment summary dispatches occur on the morning of the selected calendar day.</p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review */}
                  {currentStep === 3 && (
                    <div className="space-y-5">
                      <p className="text-xs text-slate-400">Verify your details before saving. All entries are stored securely in your JalSeJiwan profile.</p>
                      
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {/* Org block */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
                          <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-200 pb-1.5 uppercase">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Organization & Office details</span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            <div>
                              <p className="text-slate-400 font-medium">Name</p>
                              <p className="text-slate-800 font-semibold text-sm">{ownerOrg.orgName}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 font-medium">Contact Number</p>
                              <p className="text-slate-800 font-semibold text-sm">+91 {ownerOrg.contactNumber}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-slate-400 font-medium">Office Location</p>
                              <p className="text-slate-800 font-semibold text-sm">{ownerOrg.officeAddress}, {ownerOrg.district}, {ownerOrg.state}</p>
                            </div>
                          </div>
                        </div>

                        {/* Notifications block */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
                          <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-200 pb-1.5 uppercase">
                            <Bell className="w-3.5 h-3.5 text-blue-600" />
                            <span>Communication channels</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-800 font-semibold">
                              WhatsApp Client Notifications: {ownerNotify.whatsappEnabled ? "✅ Enabled" : "❌ Disabled"}
                            </p>
                            <p className="text-slate-800 font-semibold">
                              Automated Billing Reminders: {ownerNotify.autoReminders ? `✅ Enabled (Dispatched on day ${ownerNotify.reminderDay})` : "❌ Disabled"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Finish */}
                  {currentStep === 4 && (
                    <div className="text-center py-8 space-y-5">
                      <div className="inline-flex p-4 bg-green-50 text-green-600 rounded-full border border-green-100">
                        <Check className="w-12 h-12" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800">You are ready to launch!</h3>
                      <p className="text-slate-500 leading-relaxed max-w-md mx-auto text-sm">
                        Everything is successfully configured! Clicking Finish will build your portal, launch your dashboard widgets, and authorize your server credentials.
                      </p>
                    </div>
                  )}


                </>
              )}

              {/* --- ROLE: MANAGER FLOWS --- */}
              {role === 'manager' && (
                <>
                  {/* Step 1: Complete Profile */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">Provide your official professional profile details.</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Manager Full Name *</label>
                          <input 
                            type="text"
                            placeholder="Rajesh Kumar"
                            value={managerProfile.name}
                            onChange={e => setManagerProfile({...managerProfile, name: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                          />
                          {validationErrors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.name}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Official Contact Mobile *</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">+91</span>
                            <input 
                              type="text"
                              maxLength={10}
                              placeholder="9876543210"
                              value={managerProfile.phone}
                              onChange={e => setManagerProfile({...managerProfile, phone: e.target.value.replace(/\D/g, '')})}
                              className={`w-full pl-14 pr-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.phone ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                            />
                          </div>
                          {validationErrors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.phone}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Office/Residential Address *</label>
                          <textarea 
                            rows={3}
                            placeholder="Plot 45, Shastri Nagar, Pune"
                            value={managerProfile.address}
                            onChange={e => setManagerProfile({...managerProfile, address: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.address ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                          />
                          {validationErrors.address && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.address}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Verify Area */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">Verify your primary operational zone. If this is incorrect, contact your administrator.</p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Assigned Area Name / Sector *</label>
                          <input 
                            type="text"
                            placeholder="e.g. Pune Central Distribution Area"
                            value={managerArea.assignedArea}
                            onChange={e => setManagerArea({...managerArea, assignedArea: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.assignedArea ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                          />
                          {validationErrors.assignedArea && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.assignedArea}</p>}
                        </div>

                        <div className="flex items-start space-x-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <input 
                            type="checkbox"
                            id="areaVerify"
                            checked={managerArea.verified}
                            onChange={e => setManagerArea({...managerArea, verified: e.target.checked})}
                            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 outline-none border-slate-300"
                          />
                          <label htmlFor="areaVerify" className="select-none">
                            <p className="text-sm font-semibold text-slate-800">I verify my assigned area is correct</p>
                            <p className="text-xs text-slate-500 mt-0.5">By checking this, you confirm that you are authorized to supervise this region.</p>
                          </label>
                        </div>
                        {validationErrors.verified && <p className="text-red-500 text-xs font-semibold">{validationErrors.verified}</p>}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Notification Preferences */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">Configure your daily supervisor notifications.</p>
                      
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <input 
                            type="checkbox"
                            id="dailyReports"
                            checked={managerNotify.dailyReports}
                            onChange={e => setManagerNotify({...managerNotify, dailyReports: e.target.checked})}
                            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 outline-none border-slate-300"
                          />
                          <label htmlFor="dailyReports" className="select-none">
                            <p className="text-sm font-semibold text-slate-800">Daily Summary Reports</p>
                            <p className="text-xs text-slate-500 mt-0.5">Receive an automated evening status breakdown summarizing total deliveries, routes visited, and invoice collections.</p>
                          </label>
                        </div>

                        <div className="flex items-start space-x-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <input 
                            type="checkbox"
                            id="criticalAlerts"
                            checked={managerNotify.criticalAlerts}
                            onChange={e => setManagerNotify({...managerNotify, criticalAlerts: e.target.checked})}
                            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 outline-none border-slate-300"
                          />
                          <label htmlFor="criticalAlerts" className="select-none">
                            <p className="text-sm font-semibold text-slate-800">Critical System Alerts</p>
                            <p className="text-xs text-slate-500 mt-0.5">Receive immediate push notifications for low can inventory levels, payment collection anomalies, or dispatch updates.</p>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Finish */}
                  {currentStep === 4 && (
                    <div className="text-center py-8 space-y-5">
                      <div className="inline-flex p-4 bg-green-50 text-green-600 rounded-full border border-green-100">
                        <Check className="w-12 h-12" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800">Ready to supervise!</h3>
                      <p className="text-slate-500 leading-relaxed max-w-md mx-auto text-sm">
                        Your manager profile is configured. Click Finish to initialize your system supervisor dashboard.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* --- ROLE: STAFF/DELIVERY PARTNER FLOWS --- */}
              {role === 'staff' && (
                <>
                  {/* Step 1: Complete Profile */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">Please provide your mobile details so households can reach you for delivery.</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Delivery Partner Full Name *</label>
                          <input 
                            type="text"
                            placeholder="e.g. Ramesh Singh"
                            value={staffProfile.name}
                            onChange={e => setStaffProfile({...staffProfile, name: e.target.value})}
                            className={`w-full px-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                          />
                          {validationErrors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.name}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Mobile Contact Number *</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">+91</span>
                            <input 
                              type="text"
                              maxLength={10}
                              placeholder="9876543210"
                              value={staffProfile.phone}
                              onChange={e => setStaffProfile({...staffProfile, phone: e.target.value.replace(/\D/g, '')})}
                              className={`w-full pl-14 pr-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.phone ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                            />
                          </div>
                          {validationErrors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.phone}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Finish */}
                  {currentStep === 2 && (
                    <div className="text-center py-8 space-y-5">
                      <div className="inline-flex p-4 bg-green-50 text-green-600 rounded-full border border-green-100">
                        <Check className="w-12 h-12" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800">Partner profile ready!</h3>
                      <p className="text-slate-500 leading-relaxed max-w-md mx-auto text-sm">
                        Your mobile terminal profile is successfully configured. Click Finish to load your route deliveries list.
                      </p>
                    </div>
                  )}
                </>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Buttons Navigation Bar */}
          <div className="flex items-center justify-between border-t border-slate-100 mt-10 pt-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold transition-all ${
                currentStep === 1 || isSubmitting
                  ? 'opacity-0 pointer-events-none'
                  : 'text-slate-500 hover:bg-slate-50 cursor-pointer active:scale-95'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className={`flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/15 active:scale-95 ${
                isSubmitting ? 'opacity-80 pointer-events-none' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : currentStep === totalSteps ? (
                <>
                  <span>Finish Onboarding</span>
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
