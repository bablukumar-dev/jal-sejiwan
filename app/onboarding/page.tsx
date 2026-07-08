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
import { doc, updateDoc } from 'firebase/firestore';
import { setCookie } from '@/lib/authHelper';

// --- ZOD SCHEMAS FOR VALIDATION ---

// Owner validation schemas
const ownerOrgSchema = z.object({
  orgName: z.string().min(2, { message: "Organization Name must be at least 2 characters" }),
  state: z.string().min(1, { message: "Please select a State" }),
  district: z.string().min(2, { message: "District name must be at least 2 characters" }),
  officeAddress: z.string().min(5, { message: "Office Address must be at least 5 characters" }),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, { message: "Please enter a valid 10-digit Indian phone number" }),
});

const ownerManagerSchema = z.object({
  managerName: z.string().optional(),
  managerEmail: z.string().email({ message: "Please enter a valid email" }).or(z.literal('')),
  managerPin: z.string().regex(/^\d{6}$/, { message: "PIN must be exactly 6 digits" }).or(z.literal('')),
}).refine(data => {
  // If one field is filled, all must be filled
  if (data.managerName || data.managerEmail || data.managerPin) {
    return !!(data.managerName && data.managerEmail && data.managerPin);
  }
  return true;
}, {
  message: "If you want to create a manager, please fill in all fields (Name, Email, and 6-digit PIN)",
  path: ["managerName"] // highlight managerName field for the error
});

// Manager validation schemas
const managerProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().regex(/^[6-9]\d{9}$/, { message: "Please enter a valid 10-digit Indian phone number" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
});

const managerAreaSchema = z.object({
  assignedArea: z.string().min(2, { message: "Assigned Area/District is required" }),
  verified: z.literal(true, { 
    errorMap: () => ({ message: "You must verify your assigned area to proceed" }) 
  }),
});

// Staff validation schemas
const staffProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().regex(/^[6-9]\d{9}$/, { message: "Please enter a valid 10-digit Indian phone number" }),
});

const staffTermsSchema = z.object({
  acceptedTerms: z.literal(true, { 
    errorMap: () => ({ message: "You must accept the Terms of Service to proceed" }) 
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
  const { currentUser, setBusinessInfo, setCookie: setAppContextCookie } = useAppContext();
  
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

  const [ownerManager, setOwnerManager] = useState({
    managerName: '',
    managerEmail: '',
    managerPin: ''
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
  const totalSteps = role === 'owner' ? 6 : 5;

  const handleNext = async () => {
    setValidationErrors({});
    setGeneralError(null);

    // Validate the current step
    if (role === 'owner') {
      if (currentStep === 2) {
        const result = ownerOrgSchema.safeParse(ownerOrg);
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            errors[issue.path[0]] = issue.message;
          });
          setValidationErrors(errors);
          return;
        }
      } else if (currentStep === 3) {
        // Step 3: Manager (optional but must validate if anything is typed)
        const result = ownerManagerSchema.safeParse(ownerManager);
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            errors[issue.path[0]] = issue.message;
          });
          setValidationErrors(errors);
          return;
        }
      }
    } else if (role === 'manager') {
      if (currentStep === 2) {
        const result = managerProfileSchema.safeParse(managerProfile);
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            errors[issue.path[0]] = issue.message;
          });
          setValidationErrors(errors);
          return;
        }
      } else if (currentStep === 3) {
        const result = managerAreaSchema.safeParse(managerArea);
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            errors[issue.path[0]] = issue.message;
          });
          setValidationErrors(errors);
          return;
        }
      }
    } else if (role === 'staff') {
      if (currentStep === 2) {
        const result = staffProfileSchema.safeParse(staffProfile);
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            errors[issue.path[0]] = issue.message;
          });
          setValidationErrors(errors);
          return;
        }
      } else if (currentStep === 4) {
        const result = staffTermsSchema.safeParse(staffTerms);
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            errors[issue.path[0]] = issue.message;
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
        // 1. Create Manager if fields are filled out
        if (ownerManager.managerName && ownerManager.managerEmail && ownerManager.managerPin) {
          try {
            const idToken = await auth.currentUser.getIdToken();
            const response = await fetch('/api/admin/create-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({
                email: ownerManager.managerEmail,
                password: ownerManager.managerPin,
                name: ownerManager.managerName,
                role: 'manager',
                business_id: currentUser.businessId
              })
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              console.error("Non-JSON response received:", await response.text());
              throw new Error("Server returned an invalid response (not JSON).");
            }

            if (!response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const apiResult = await response.json();
                throw new Error(apiResult.error || 'Failed to create manager account');
              } else {
                const text = await response.text();
                console.error("API error (not JSON):", text);
                throw new Error('Failed to create manager account (server error)');
              }
            }
          } catch (mErr: any) {
            console.error("Failed to create manager during onboarding:", mErr);
            throw new Error(`Manager account creation failed: ${mErr.message}. You can fix this or remove manager details to skip.`);
          }
        }

        // 2. Prepare Business Info payload
        const updatedBusinessInfo = {
          name: ownerOrg.orgName,
          ownerName: currentUser.role === 'owner' ? ownerOrg.orgName + " Head" : "Owner",
          phone: ownerOrg.contactNumber,
          address: ownerOrg.officeAddress,
          defaultRate: 45,
          whatsappConfig: {
            enabled: ownerNotify.whatsappEnabled,
            useApi: false,
            reminderDay: ownerNotify.reminderDay,
          }
        };

        // Update local context/state
        setBusinessInfo(updatedBusinessInfo);
        localStorage.setItem('businessInfo', JSON.stringify(updatedBusinessInfo));

        // 3. Update Firestore Document for Owner
        await updateDoc(userDocRef, {
          onboardingCompleted: true,
          profileCompleted: true,
          updatedAt: new Date().toISOString(),
          businessInfo: updatedBusinessInfo,
        });

      } else if (role === 'manager') {
        // Update Firestore Document for Manager
        await updateDoc(userDocRef, {
          onboardingCompleted: true,
          profileCompleted: true,
          updatedAt: new Date().toISOString(),
          managerProfile: {
            name: managerProfile.name,
            phone: managerProfile.phone,
            address: managerProfile.address,
            assignedArea: managerArea.assignedArea,
            notifyDailyReports: managerNotify.dailyReports,
            notifyCriticalAlerts: managerNotify.criticalAlerts
          }
        });
      } else if (role === 'staff') {
        // Update Firestore Document for Staff
        await updateDoc(userDocRef, {
          onboardingCompleted: true,
          profileCompleted: true,
          updatedAt: new Date().toISOString(),
          staffProfile: {
            name: staffProfile.name,
            phone: staffProfile.phone,
            languagePreference: staffLang,
            acceptedTermsAt: new Date().toISOString()
          }
        });
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
        case 1: return <Globe className="w-5 h-5" />;
        case 2: return <Building2 className="w-5 h-5" />;
        case 3: return <UserPlus className="w-5 h-5" />;
        case 4: return <Bell className="w-5 h-5" />;
        case 5: return <FileText className="w-5 h-5" />;
        case 6: return <CheckCircle2 className="w-5 h-5" />;
        default: return <ChevronRight className="w-5 h-5" />;
      }
    } else if (role === 'manager') {
      switch (step) {
        case 1: return <Globe className="w-5 h-5" />;
        case 2: return <User className="w-5 h-5" />;
        case 3: return <MapPin className="w-5 h-5" />;
        case 4: return <Bell className="w-5 h-5" />;
        case 5: return <CheckCircle2 className="w-5 h-5" />;
        default: return <ChevronRight className="w-5 h-5" />;
      }
    } else {
      switch (step) {
        case 1: return <Globe className="w-5 h-5" />;
        case 2: return <User className="w-5 h-5" />;
        case 3: return <Globe className="w-5 h-5" />;
        case 4: return <ShieldCheck className="w-5 h-5" />;
        case 5: return <CheckCircle2 className="w-5 h-5" />;
        default: return <ChevronRight className="w-5 h-5" />;
      }
    }
  };

  const getStepTitle = (step: number) => {
    if (role === 'owner') {
      switch (step) {
        case 1: return "Welcome to JalSeJiwan";
        case 2: return "Organization Info";
        case 3: return "First Manager (Optional)";
        case 4: return "Notification Setup";
        case 5: return "Review & Confirm";
        case 6: return "All Done!";
        default: return "";
      }
    } else if (role === 'manager') {
      switch (step) {
        case 1: return "Welcome Manager";
        case 2: return "Complete Profile";
        case 3: return "Verify Area";
        case 4: return "Alert Preferences";
        case 5: return "Ready to Launch!";
        default: return "";
      }
    } else {
      switch (step) {
        case 1: return "Welcome Delivery Partner";
        case 2: return "Partner Profile";
        case 3: return "Language Choice";
        case 4: return "Terms & Security";
        case 5: return "Ready to Deliver!";
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
                  {/* Step 1: Welcome */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <p className="text-slate-600 leading-relaxed">
                        Namaste! Welcome as the <span className="font-semibold text-blue-600">Water System Owner</span>. 
                        JalSeJiwan lets you monitor tank storage, dispatch delivery partners, invoice households, and automate customer payment reminders on WhatsApp.
                      </p>
                      <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-50 space-y-3">
                        <h4 className="font-semibold text-slate-800 text-sm">What we will set up in this quick onboarding:</h4>
                        <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-5">
                          <li>Your official organization & business registration profile</li>
                          <li>Your initial source node setup (Water project name, water scheme, storage tanks & pump stations)</li>
                          <li>Your first Manager delegate credential (optional)</li>
                          <li>Your preferred communication & WhatsApp auto-alert timings</li>
                        </ul>
                      </div>
                      <p className="text-xs text-slate-400 font-sans">
                        Click the &quot;Next&quot; button below to configure your water management portal.
                      </p>
                    </div>
                  )}

                  {/* Step 2: Org Info */}
                  {currentStep === 2 && (
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

                  {/* Step 3: Create First Manager */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">If you want to delegate operations, you can register your first Manager account right now. Leave these fields blank if you prefer to set this up later from your staff menu.</p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Manager Full Name</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                              <User className="w-4 h-4" />
                            </span>
                            <input 
                              type="text"
                              placeholder="e.g. Rajesh Kumar"
                              value={ownerManager.managerName}
                              onChange={e => setOwnerManager({...ownerManager, managerName: e.target.value})}
                              className={`w-full pl-11 pr-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.managerName ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Manager Email Address</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                              <Globe className="w-4 h-4" />
                            </span>
                            <input 
                              type="email"
                              placeholder="e.g. rajesh@swajal.com"
                              value={ownerManager.managerEmail}
                              onChange={e => setOwnerManager({...ownerManager, managerEmail: e.target.value})}
                              className={`w-full pl-11 pr-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.managerEmail ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                            />
                          </div>
                          {validationErrors.managerEmail && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.managerEmail}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Manager 6-digit Login PIN / Password</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                              <Lock className="w-4 h-4" />
                            </span>
                            <input 
                              type="text"
                              maxLength={6}
                              placeholder="123456"
                              value={ownerManager.managerPin}
                              onChange={e => setOwnerManager({...ownerManager, managerPin: e.target.value.replace(/\D/g, '')})}
                              className={`w-full pl-11 pr-4 py-3 border rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${validationErrors.managerPin ? 'border-red-400 bg-red-50/30' : 'border-slate-200'}`}
                            />
                          </div>
                          {validationErrors.managerPin && <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.managerPin}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Notifications */}
                  {currentStep === 4 && (
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

                  {/* Step 5: Review */}
                  {currentStep === 5 && (
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

                        {/* Delegate manager block */}
                        {ownerManager.managerName ? (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
                            <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-200 pb-1.5 uppercase">
                              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                              <span>Delegate Manager Profile</span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                              <div>
                                <p className="text-slate-400 font-medium">Name</p>
                                <p className="text-slate-800 font-semibold text-sm">{ownerManager.managerName}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-medium">Email Address</p>
                                <p className="text-slate-800 font-semibold text-sm">{ownerManager.managerEmail}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 text-xs italic text-center">
                            No Manager credentials registered during onboarding (Can delegate later).
                          </div>
                        )}

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

                  {/* Step 6: Finish */}
                  {currentStep === 6 && (
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

                        {/* Water setup block */}
                        {/* Removed */}

                        {/* Delegate manager block */}
                        {ownerManager.managerName ? (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
                            <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-200 pb-1.5 uppercase">
                              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                              <span>Delegate Manager Profile</span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                              <div>
                                <p className="text-slate-400 font-medium">Name</p>
                                <p className="text-slate-800 font-semibold text-sm">{ownerManager.managerName}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-medium">Email Address</p>
                                <p className="text-slate-800 font-semibold text-sm">{ownerManager.managerEmail}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 text-xs italic text-center">
                            No Manager credentials registered during onboarding (Can delegate later).
                          </div>
                        )}

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

                  {/* Step 7: Finish */}
                  {currentStep === 7 && (
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
                  {/* Step 1: Welcome */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <p className="text-slate-600 leading-relaxed">
                        Welcome, Operational Manager! You have been registered under a JalSeJiwan water scheme license. 
                        As a manager, you supervise daily cylinder allocations, authorize delivery routes, and log system metrics.
                      </p>
                      <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-50 space-y-3">
                        <h4 className="font-semibold text-slate-800 text-sm">We will quickly confirm:</h4>
                        <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-5">
                          <li>Your official contact profile details</li>
                          <li>Your supervisor dashboard area scope</li>
                          <li>Your push alert configuration preferences</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Complete Profile */}
                  {currentStep === 2 && (
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

                  {/* Step 3: Verify Area */}
                  {currentStep === 3 && (
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

                  {/* Step 4: Notification Preferences */}
                  {currentStep === 4 && (
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
                            <p className="text-xs text-slate-500 mt-0.5">Receive immediate push notifications for low cylinder stock levels, critical tank volumes, or pump station failures.</p>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Finish */}
                  {currentStep === 5 && (
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
                  {/* Step 1: Welcome */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <p className="text-slate-600 leading-relaxed">
                        Namaste and Welcome! You are registered as a <span className="font-semibold text-blue-600">JalSeJiwan Delivery Partner</span>. 
                        Your mobile terminal lets you record route dropoffs, receive empty return cylinders, collect invoice payments, and navigate scheduled sectors.
                      </p>
                      <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-50 space-y-3">
                        <h4 className="font-semibold text-slate-800 text-sm">What we will confirm in 2 minutes:</h4>
                        <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-5">
                          <li>Confirm your mobile profile name</li>
                          <li>Select your preferred terminal language (English / Hindi)</li>
                          <li>Accept delivery partner security conditions</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Complete Profile */}
                  {currentStep === 2 && (
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

                  {/* Step 3: Language Choice */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">Choose your preferred mobile terminal application language.</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          onClick={() => setStaffLang('English')}
                          className={`p-5 rounded-2xl border-2 text-center cursor-pointer select-none transition-all duration-200 ${
                            staffLang === 'English' 
                              ? 'border-blue-600 bg-blue-50/40 text-blue-800 font-bold scale-[1.02] shadow-md' 
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <p className="text-base">English</p>
                          <p className="text-xs text-slate-400 mt-1">Default language</p>
                        </div>

                        <div 
                          onClick={() => setStaffLang('Hindi')}
                          className={`p-5 rounded-2xl border-2 text-center cursor-pointer select-none transition-all duration-200 ${
                            staffLang === 'Hindi' 
                              ? 'border-blue-600 bg-blue-50/40 text-blue-800 font-bold scale-[1.02] shadow-md' 
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <p className="text-base">हिन्दी / Hindi</p>
                          <p className="text-xs text-slate-400 mt-1">हिंदी में काम करें</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Terms & Security */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">Read and accept delivery protocols and safety regulations.</p>
                      
                      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-xs text-slate-500 h-40 overflow-y-auto space-y-2 font-mono scrollbar-thin">
                        <p className="font-semibold text-slate-700">1. CYLINDER SAFETY CODE</p>
                        <p>I agree to handle water cylinders carefully, ensuring caps are sealed securely to prevent leakage or contamination during transport.</p>
                        <p className="font-semibold text-slate-700">2. PAYMENT SETTLEMENT</p>
                        <p>I agree to immediately log any cash or digital payment collected at the doorstep. All collected invoice cash must be settled daily with the organization supervisor.</p>
                        <p className="font-semibold text-slate-700">3. SECURE ACCOUNT PROTOCOL</p>
                        <p>I agree to keep my mobile login PIN secure and verify that deliveries are conducted personally and logged with accurate geographic coordinates.</p>
                      </div>

                      <div className="flex items-start space-x-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <input 
                          type="checkbox"
                          id="acceptTerms"
                          checked={staffTerms.acceptedTerms}
                          onChange={e => setStaffTerms({...staffTerms, acceptedTerms: e.target.checked})}
                          className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 outline-none border-slate-300"
                        />
                        <label htmlFor="acceptTerms" className="select-none">
                          <p className="text-sm font-semibold text-slate-800">Accept delivery conditions</p>
                          <p className="text-xs text-slate-500 mt-0.5">I agree to the JalSeJiwan partner guidelines, safety requirements, and financial settlement terms.</p>
                        </label>
                      </div>
                      {validationErrors.acceptedTerms && <p className="text-red-500 text-xs font-semibold">{validationErrors.acceptedTerms}</p>}
                    </div>
                  )}

                  {/* Step 5: Finish */}
                  {currentStep === 5 && (
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
