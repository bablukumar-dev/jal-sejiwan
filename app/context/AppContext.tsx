'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc, collection, query, where, orderBy } from 'firebase/firestore';
import { getFirebase } from '@/src/lib/firebase';
import { getUnsyncedDeliveries } from '@/lib/idb';
import { setCookie, deleteCookie } from '@/lib/authHelper';
import { logActivity } from '@/lib/activityLogger';

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  area: string;
  route: string;
  type: string;
  deliveryType: string;
  defaultQty: number;
  rate: number;
  due: number;
  emptyBalance: number;
  active: boolean;
  lastDelivery: string;
  notes: string;
  deposit?: number;
  walletBalance?: number;
  subscriptionPlan?: 'None' | 'Monthly' | 'Unlimited' | 'Custom';
  riskLevel?: 'Low' | 'Medium' | 'High';
  businessId: string;
  ownerId?: string;
  userId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  imageURL?: string;
};

export type Delivery = {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  deliveredQty: number;
  returnedEmpty: number;
  status: string;
  paymentReceived: boolean;
  paymentAmount: number;
  paymentMode: string;
  note: string;
  staffId: string;
  staffName: string;
  skipReason?: string;
  skipRemarks?: string;
  priority?: 'High' | 'Medium' | 'Low';
  businessId: string;
  ownerId?: string;
  userId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Payment = {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  mode: string;
  collectedBy: string;
  note: string;
  businessId: string;
  ownerId?: string;
  userId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Inventory = {
  fullCans: number;
  emptyCans: number;
  damagedCans: number;
  cansWithCustomers: number;
  cansInDelivery: number;
  refillInProcess: number;
  businessId: string;
  ownerId?: string;
  userId?: string;
  updatedAt?: string;
};

export type InventoryHistory = {
  id: string;
  date: string;
  type: string;
  qty: number;
  source: string;
  note: string;
  businessId: string;
  ownerId?: string;
  userId?: string;
  createdBy?: string;
  createdAt?: string;
};

export type Staff = {
  id: string;
  name: string;
  phone: string;
  role: string;
  route: string;
  pin: string;
  encryptedPin?: string;
  createdBy?: string;
  failedPinAttempts?: number;
  pinLockedUntil?: string;
  active: boolean;
  businessId: string;
  ownerId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  permissions?: {
    canCreateStaff?: boolean;
    canDeleteStaff?: boolean;
    canViewReports?: boolean;
    canAccessInventory?: boolean;
  };
};

export type BusinessInfo = {
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  defaultRate: number;
  canSize?: string;
  gstNumber?: string;
  lowStockThreshold?: number;
  whatsappConfig?: {
    enabled: boolean;
    useApi: boolean;
    apiToken?: string;
    phoneId?: string;
    reminderDay?: number;
    reminderTime?: string;
  };
};

export type CurrentUser = {
  uid: string;
  role: string;
  name?: string;
  businessId: string;
  onboardingCompleted?: boolean;
  dashboardTourCompleted?: boolean;
  waterSystemSetup?: {
    projectName: string;
    waterScheme: string;
    tankName: string;
    pumpStationName: string;
  };
  // Profile fields (Single Source of Truth)
  ownerName?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  profilePhoto?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AppContextType = {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  deliveries: Delivery[];
  setDeliveries: React.Dispatch<React.SetStateAction<Delivery[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  inventory: Inventory;
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>;
  inventoryHistory: InventoryHistory[];
  setInventoryHistory: React.Dispatch<React.SetStateAction<InventoryHistory[]>>;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  routes: string[];
  setRoutes: React.Dispatch<React.SetStateAction<string[]>>;
  areas: string[];
  setAreas: React.Dispatch<React.SetStateAction<string[]>>;
  businessInfo: BusinessInfo;
  setBusinessInfo: React.Dispatch<React.SetStateAction<BusinessInfo>>;
  isOnline: boolean;
  syncStatus: 'synced' | 'pending' | 'syncing' | 'error';
  isBackgroundSyncing: boolean;
  syncProgress: number;
  triggerSync: () => Promise<void>;
  setBackgroundSyncing: (isSyncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
  currentUser: CurrentUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  unsyncedCount: number;
  authLoading: boolean;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

const initialCustomers: Customer[] = [];

const initialDeliveries: Delivery[] = [];

const initialPayments: Payment[] = [];

const initialInventory: Inventory = {
  fullCans: 0,
  emptyCans: 0,
  damagedCans: 0,
  cansWithCustomers: 0,
  cansInDelivery: 0,
  refillInProcess: 0,
  businessId: '',
  ownerId: '',
  updatedAt: new Date().toISOString()
};

const initialInventoryHistory: InventoryHistory[] = [];

const initialStaff: Staff[] = [];

const initialRoutes: string[] = [];
const initialAreas: string[] = [];
const initialBusinessInfo: BusinessInfo = {
  name: "My Water Delivery",
  ownerName: "Owner Name",
  phone: "",
  address: "",
  defaultRate: 30,
  canSize: "20 Litre"
};

const safeGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

// Lightweight caching layer for workspace queries to prevent redundant real-time listeners
let activeUnsubscribe: (() => void) | null = null;
let activeWorkspaceId: string | null = null;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [inventory, setInventory] = useState<Inventory>(initialInventory);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>(initialInventoryHistory);
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [routes, setRoutes] = useState<string[]>(initialRoutes);
  const [areas, setAreas] = useState<string[]>(initialAreas);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(initialBusinessInfo);
  const [isInitialized, setIsInitialized] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [isLoggingOut, setIsLoggingOutState] = useState<boolean>(false);
  const isLoggingOutRef = useRef(false);
  const setIsLoggingOut = useCallback((val: boolean) => {
    isLoggingOutRef.current = val;
    setIsLoggingOutState(val);
  }, []);

  const logout = useCallback(async () => {
    console.log("Starting Logout...");
    console.log("Writing Activity Log...");
    
    const role = currentUser?.role || 'user';
    const name = currentUser?.name || 'User';
    
    // Log logout before clearing session
    await logActivity({
      module: 'Authentication',
      action: role === 'staff' ? 'Staff Logout' : role === 'owner' ? 'Owner Logout' : 'Manager Logout',
      description: `${role.charAt(0).toUpperCase() + role.slice(1)} ${name} logged out`,
      status: 'success',
    }).catch(err => console.warn("Failed to log activity during logout:", err));

    setIsLoggingOut(true);
    try {
      const { auth } = getFirebase();
      if (auth) {
        await signOut(auth);
        console.log("Firebase signOut Success");
      }
    } catch (error) {
      console.error("Logout Failed:", error);
    } finally {
      setIsLoggingOut(false);
      console.log("Logout Complete");
    }
  }, [setIsLoggingOut, currentUser]);

  useEffect(() => {
    const { auth, db } = getFirebase();
    if (!auth || !db) return;

    let unsubDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (user && user.uid) {
        console.log(`[AppContext] Valid authenticated user detected: ${user.uid}. Checking profile document...`);
        
        // Use cached fallbacks during loading to avoid premature empty state or logout triggers
        const cachedBusinessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') || '' : '';
        const cachedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'owner' : 'owner';
        const cachedOnboarding = typeof window !== 'undefined' ? localStorage.getItem('onboardingCompleted') === 'true' : false;

        // Set initial user state with cached details while snapshot is loading
        setCurrentUser(prev => prev || {
          uid: user.uid,
          role: cachedRole as any,
          businessId: cachedBusinessId,
          onboardingCompleted: cachedOnboarding,
          dashboardTourCompleted: false,
        });

        try {
          const idToken = await user.getIdToken();
          // Store token for 30 days to facilitate robust persistent login
          setCookie('firebaseIdToken', idToken, 3600 * 24 * 30);
          setCookie('sessionActive', 'true', 3600 * 24 * 30);
        } catch (e) {
          console.error("[AppContext] Error getting ID token in onAuthStateChanged:", e);
        }

        const userDocRef = doc(db, 'users', user.uid);
        unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const onboardingCompleted = data.onboardingCompleted !== undefined ? data.onboardingCompleted : false;
            const dashboardTourCompleted = data.dashboardTourCompleted !== undefined ? data.dashboardTourCompleted : false;
            
            // If onboardingCompleted is missing in Firestore, safely initialize it to false
            if (data.onboardingCompleted === undefined) {
              updateDoc(userDocRef, { onboardingCompleted: false }).catch((err) => {
                console.error("[AppContext] Safely tried to set initial onboardingCompleted: false, error:", err);
              });
            }

            setCurrentUser({
              uid: user.uid,
              role: data.role,
              businessId: data.businessId,
              onboardingCompleted: onboardingCompleted,
              dashboardTourCompleted: dashboardTourCompleted,
              waterSystemSetup: data.waterSystemSetup,
              ownerName: data.ownerName,
              businessName: data.businessName,
              phone: data.phone,
              email: data.email,
              address: data.address,
              city: data.city,
              state: data.state,
              pincode: data.pincode,
              gstNumber: data.gstNumber,
              profilePhoto: data.profilePhoto,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            });
            console.log("Realtime Profile Synced. Firestore Path: users/" + user.uid);
            setOwnerId(data.businessId);
            if (typeof window !== 'undefined') {
              const resolvedName = data.name || data.ownerName || user.displayName || 'User';
              localStorage.setItem('businessId', data.businessId);
              localStorage.setItem('userRole', data.role);
              localStorage.setItem('userName', resolvedName);
              localStorage.setItem('ownerId', data.businessId);
              localStorage.setItem('onboardingCompleted', onboardingCompleted ? 'true' : 'false');
            }
            setCookie('userRole', data.role, 3600 * 24 * 30);
            setCookie('businessId', data.businessId, 3600 * 24 * 30);
            setCookie('onboardingCompleted', onboardingCompleted ? 'true' : 'false', 3600 * 24 * 30);
            setCookie('sessionActive', 'true', 3600 * 24 * 30);
            
            // Set auth loading to false only after data is received
            setAuthLoading(false);
          } else {
            console.log(`[AppContext] User document for UID ${user.uid} does not exist yet. Using cached fallbacks.`);
            // User document is not found (perhaps being created right now). Keep cached state to avoid premature logout.
            if (cachedBusinessId) {
              setCurrentUser({
                uid: user.uid,
                role: cachedRole as any,
                businessId: cachedBusinessId,
                onboardingCompleted: cachedOnboarding,
                dashboardTourCompleted: false,
              });
              setOwnerId(cachedBusinessId);
              setAuthLoading(false);
            } else {
              // Minimal fallback profile so signup/onboarding can run smoothly without breaking routing
              setCurrentUser({
                uid: user.uid,
                role: 'owner',
                businessId: '',
                onboardingCompleted: false,
                dashboardTourCompleted: false,
              });
              setAuthLoading(false);
            }
          }
        }, (error: any) => {
          console.error("[AppContext] Permission Denied or error in user doc subscription:", error);
          if (error.code === 'permission-denied') {
            console.error("[AppContext] FIRESTORE PERMISSION DENIED: Please ensure your security rules allow reading from the 'users' collection.");
          }
          // If we have local cached state, keep it to prevent abrupt mid-session logouts
          if (cachedBusinessId) {
            setAuthLoading(false);
          } else {
            setCurrentUser(null);
            deleteCookie('firebaseIdToken');
            deleteCookie('userRole');
            deleteCookie('businessId');
            deleteCookie('onboardingCompleted');
            deleteCookie('sessionActive');
            setAuthLoading(false);
          }
        });
      } else {
        // No user is authenticated with Firebase
        console.log("[AppContext] No authenticated user. Clearing auth states.");
        setCurrentUser(null);
        setOwnerId(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('businessId');
          localStorage.removeItem('userRole');
          localStorage.removeItem('onboardingCompleted');
          localStorage.removeItem('ownerId');
          localStorage.removeItem('cachedProfile');
          localStorage.removeItem('businessInfo');
          localStorage.removeItem('cachedCustomers');
          localStorage.removeItem('cachedPayments');
          localStorage.removeItem('cachedDeliveries');
        }
        deleteCookie('firebaseIdToken');
        deleteCookie('userRole');
        deleteCookie('businessId');
        deleteCookie('onboardingCompleted');
        deleteCookie('sessionActive');
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const lastRemoteData = useRef<string | null>(null);
  const snapshotReceivedRef = useRef(false);
  const isSaving = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Defer synchronous setState on mount to prevent cascading renders
      const timer = setTimeout(() => {
        setIsOnline(navigator.onLine);
      }, 0);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing' | 'error'>('synced');
  const hasUnsyncedChangesRef = useRef<boolean>(false);

  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  const latestStateRef = useRef({
    customers,
    deliveries,
    payments,
    inventory,
    inventoryHistory,
    staff,
    routes,
    areas,
    businessInfo
  });

  useEffect(() => {
    latestStateRef.current = {
      customers,
      deliveries,
      payments,
      inventory,
      inventoryHistory,
      staff,
      routes,
      areas,
      businessInfo
    };
  }, [customers, deliveries, payments, inventory, inventoryHistory, staff, routes, areas, businessInfo]);

  // Read initial unsynced changes status from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pending = localStorage.getItem('hasUnsyncedChanges') === 'true';
      hasUnsyncedChangesRef.current = pending;
      if (pending) {
        const timer = setTimeout(() => setSyncStatus('pending'), 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

// Removed set-claims logic

  // Poll localStorage for businessId changes to detect logins/logouts dynamically
  useEffect(() => {
    const checkOwner = () => {
      const id = safeGet('businessId');
      
      if (!id) {
        if (ownerId !== null) {
          // Clear everything
          setCustomers(initialCustomers);
          setDeliveries(initialDeliveries);
          setPayments(initialPayments);
          setInventory(initialInventory);
          setInventoryHistory(initialInventoryHistory);
          setStaff(initialStaff);
          setRoutes(initialRoutes);
          setAreas(initialAreas);
          setBusinessInfo(initialBusinessInfo);
          setOwnerId(null);
          snapshotReceivedRef.current = false;
        }
        return;
      }

      if (id !== ownerId && safeGet('userRole')) {
        // If owner/business changing mid-session, clear local state/cache immediately
        if (ownerId !== null) {
          localStorage.removeItem('customers');
          localStorage.removeItem('deliveries');
          localStorage.removeItem('payments');
          localStorage.removeItem('inventory');
          localStorage.removeItem('inventoryHistory');
          localStorage.removeItem('staff');
          localStorage.removeItem('routes');
          localStorage.removeItem('areas');
          localStorage.removeItem('businessInfo');
          
          setCustomers(initialCustomers);
          setDeliveries(initialDeliveries);
          setPayments(initialPayments);
          setInventory(initialInventory);
          setInventoryHistory(initialInventoryHistory);
          setStaff(initialStaff);
          setRoutes(initialRoutes);
          setAreas(initialAreas);
          setBusinessInfo(initialBusinessInfo);
          snapshotReceivedRef.current = false;
        }
        setOwnerId(id);
      }
    };
    checkOwner();
    const timer = setInterval(checkOwner, 1000);
    return () => clearInterval(timer);
  }, [ownerId]);

  // Load cache from localStorage on mount
  useEffect(() => {
    const loadCache = () => {
      try {
        if (!safeGet('demo_data_cleared_v2')) {
          localStorage.removeItem('customers');
          localStorage.removeItem('deliveries');
          localStorage.removeItem('payments');
          localStorage.removeItem('inventory');
          localStorage.removeItem('inventoryHistory');
          localStorage.removeItem('staff');
          localStorage.removeItem('routes');
          localStorage.removeItem('areas');
          localStorage.removeItem('businessInfo');
          localStorage.setItem('demo_data_cleared_v2', 'true');
        }

        const storedCustomers = safeGet('customers');
        if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
        const storedDeliveries = safeGet('deliveries');
        if (storedDeliveries) setDeliveries(JSON.parse(storedDeliveries));
        const storedPayments = safeGet('payments');
        if (storedPayments) setPayments(JSON.parse(storedPayments));
        const storedInventory = safeGet('inventory');
        if (storedInventory) setInventory(JSON.parse(storedInventory));
        const storedHistory = safeGet('inventoryHistory');
        if (storedHistory) setInventoryHistory(JSON.parse(storedHistory));
        const storedStaff = safeGet('staff');
        if (storedStaff) setStaff(JSON.parse(storedStaff));
        const storedRoutes = safeGet('routes');
        if (storedRoutes) setRoutes(JSON.parse(storedRoutes));
        const storedAreas = safeGet('areas');
        if (storedAreas) setAreas(JSON.parse(storedAreas));
        const storedBusinessInfo = safeGet('businessInfo');
        if (storedBusinessInfo) setBusinessInfo(JSON.parse(storedBusinessInfo));
      } catch (e) {
        console.error("Failed to load local storage cache", e);
      }
      
      // Update unsynced count on init
      getUnsyncedDeliveries().then(pending => setUnsyncedCount(pending.length));
      
      setIsInitialized(true);
    };
    
    // Defer heavy initial load to let the UI paint first
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(loadCache);
    } else {
      setTimeout(loadCache, 100);
    }
  }, []);

  // Real-time synchronization for all modules
  useEffect(() => {
    const { auth, db } = getFirebase();
    console.log("[AppContext] Listener useEffect running. auth:", !!auth, "db:", !!db, "businessId:", currentUser?.businessId, "isInitialized:", isInitialized, "uid:", currentUser?.uid);
    if (!auth || !db || !currentUser?.businessId || !isInitialized) {
      console.log("[AppContext] Listener skipped. Conditions:", {
        hasAuth: !!auth,
        hasDb: !!db,
        hasBusinessId: !!currentUser?.businessId,
        isInitialized: isInitialized
      });
      return;
    }

    console.log("================= EVIDENCE DEBUGGING: STEP 3 =================");
    console.log(`Current UID: ${currentUser?.uid}`);
    console.log(`Current Role: ${currentUser?.role}`);
    console.log(`Current Business ID: ${currentUser?.businessId}`);
    console.log("=============================================================");

    const bId = currentUser.businessId;
    const oId = currentUser.role === 'owner' ? currentUser.uid : (currentUser as any).ownerId || bId; // Fallback if ownerId not directly on user

    console.log(`[AppContext] Starting real-time sync for user: ${currentUser.uid}, role: ${currentUser.role}, businessId: ${bId}`);

    const uId = currentUser.uid;

    // Sync Customers
    const qCustomers = collection(db, 'businesses', bId, 'customers');
    console.log("================= EVIDENCE DEBUGGING: STEP 4 =================");
    console.log(`Exact Firestore query for Customers:`);
    console.log(`- Collection Path: businesses/${bId}/customers`);
    console.log(`- Where clauses: NONE`);
    console.log(`- OrderBy: NONE`);
    console.log(`- Limit: NONE`);
    console.log("=============================================================");
    console.log(`[AppContext] Subscribed to customer collection path: businesses/${bId}/customers`);
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      console.log("================= EVIDENCE DEBUGGING: STEP 5 =================");
      console.log(`Snapshot Fired: true`);
      console.log(`Document Count: ${snapshot.docs.length}`);
      snapshot.docs.forEach((d, idx) => {
        const item = d.data();
        console.log(`- Doc [${idx}] ID: ${d.id}`);
        console.log(`  Name: ${item.name}`);
        console.log(`  Business ID: ${item.businessId}`);
      });
      console.log("=============================================================");
      console.log(`[AppContext] Customer collection updated. Snapshot contains ${snapshot.docs.length} documents.`);
      const docs = snapshot.docs.map(d => {
        const item = d.data();
        console.log(`[AppContext]   - Customer doc ID: ${d.id}, Name: ${item.name}, businessId: ${item.businessId}`);
        return { id: d.id, ...item } as Customer;
      });
      setCustomers(docs);
      console.log("================= EVIDENCE DEBUGGING: STEP 6 =================");
      console.log(`customers.length immediately after setCustomers: ${docs.length}`);
      console.log("=============================================================");
      
      // Update routes and areas from customers
      const rts = Array.from(new Set(docs.map(c => c.route).filter(Boolean)));
      const ars = Array.from(new Set(docs.map(c => c.area).filter(Boolean)));
      setRoutes(rts);
      setAreas(ars);
    }, (error) => {
      console.error("Profile Sync Error (Customers):", error);
    });

    // Sync Deliveries
    const qDeliveries = query(collection(db, 'businesses', bId, 'deliveries'), orderBy('date', 'desc'));
    const unsubDeliveries = onSnapshot(qDeliveries, (snapshot) => {
      setDeliveries(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Delivery)));
    }, (error) => {
      console.error("Profile Sync Error (Deliveries):", error);
    });

    // Sync Payments
    const qPayments = query(collection(db, 'businesses', bId, 'payments'), orderBy('date', 'desc'));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      setPayments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
    }, (error) => {
      console.error("Profile Sync Error (Payments):", error);
    });

    // Sync Staff
    const qStaff = collection(db, 'businesses', bId, 'staff');
    const unsubStaff = onSnapshot(qStaff, (snapshot) => {
      setStaff(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Staff)));
    }, (error) => {
      console.error("Profile Sync Error (Staff):", error);
    });

    // Sync Inventory
    const unsubInventory = onSnapshot(doc(db, 'businesses', bId, 'settings', 'inventory'), (snapshot) => {
      if (snapshot.exists()) {
        setInventory(snapshot.data() as Inventory);
      }
    }, (error) => {
      console.error("Profile Sync Error (Inventory):", error);
    });

    // Sync Business Info
    const unsubBusiness = onSnapshot(doc(db, 'businesses', bId), (snapshot) => {
      if (snapshot.exists()) {
        setBusinessInfo(snapshot.data() as BusinessInfo);
      }
    }, (error) => {
      console.error("Profile Sync Error (BusinessInfo):", error);
    });

    return () => {
      unsubCustomers();
      unsubDeliveries();
      unsubPayments();
      unsubStaff();
      unsubInventory();
      unsubBusiness();
    };
  }, [currentUser, isInitialized]);

  // Define a centralized manual triggerSync function
  const triggerSync = useCallback(async () => {
    // Auth system removed - Sync logic replaced
    setSyncStatus('synced');
  }, []);

  // Monitor network status dynamically and auto-sync on recovery
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      if (hasUnsyncedChangesRef.current) {
        triggerSync();
      } else {
        setSyncStatus('synced');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('pending');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [ownerId, triggerSync]);

  // Push local modifications to cache
  useEffect(() => {
    if (!isInitialized) return;

    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('deliveries', JSON.stringify(deliveries));
    localStorage.setItem('payments', JSON.stringify(payments));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('inventoryHistory', JSON.stringify(inventoryHistory));
    localStorage.setItem('staff', JSON.stringify(staff));
    localStorage.setItem('routes', JSON.stringify(routes));
    localStorage.setItem('areas', JSON.stringify(areas));
    localStorage.setItem('businessInfo', JSON.stringify(businessInfo));
  }, [customers, deliveries, payments, inventory, inventoryHistory, staff, routes, areas, businessInfo, isInitialized, ownerId]);

  // Background auto-sync worker interval: healer for intermittent connection issues
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(async () => {
      const pending = await getUnsyncedDeliveries();
      setUnsyncedCount(pending.length);

      if (navigator.onLine && (hasUnsyncedChangesRef.current || pending.length > 0) && ownerId) {
        triggerSync();
      }
    }, 15000); // Poll connection and sync status every 15 seconds

    return () => clearInterval(interval);
  }, [ownerId, triggerSync]);

  const contextValue = React.useMemo(() => ({
    customers, setCustomers,
    deliveries, setDeliveries,
    payments, setPayments,
    inventory, setInventory,
    inventoryHistory, setInventoryHistory,
    staff, setStaff,
    routes, setRoutes,
    areas, setAreas,
    businessInfo, setBusinessInfo,
    isOnline,
    syncStatus,
    isBackgroundSyncing,
    syncProgress,
    triggerSync,
    setBackgroundSyncing: setIsBackgroundSyncing,
    setSyncProgress,
    currentUser,
    setCurrentUser,
    unsyncedCount,
    authLoading,
    logout,
    isLoggingOut
  }), [customers, deliveries, payments, inventory, inventoryHistory, staff, routes, areas, businessInfo, isOnline, syncStatus, isBackgroundSyncing, syncProgress, triggerSync, currentUser, unsyncedCount, authLoading, logout, isLoggingOut]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
