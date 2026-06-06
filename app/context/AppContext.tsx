 
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

export type Customer = {
  id: number;
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
};

export type Delivery = {
  id: number;
  customerId: number;
  customerName: string;
  date: string;
  deliveredQty: number;
  returnedEmpty: number;
  status: string;
  paymentReceived: boolean;
  paymentAmount: number;
  paymentMode: string;
  note: string;
  staffId: number;
  staffName: string;
  skipReason?: string;
  skipRemarks?: string;
  priority?: 'High' | 'Medium' | 'Low';
};

export type Payment = {
  id: number;
  customerId: number;
  customerName: string;
  date: string;
  amount: number;
  mode: string;
  collectedBy: string;
  note: string;
};

export type Inventory = {
  fullCans: number;
  emptyCans: number;
  damagedCans: number;
  cansWithCustomers: number;
  cansInDelivery: number;
  refillInProcess: number;
};

export type InventoryHistory = {
  id: number;
  date: string;
  type: string;
  qty: number;
  source: string;
  note: string;
};

export type Staff = {
  id: number;
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
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialCustomers: Customer[] = [];

const initialDeliveries: Delivery[] = [];

const initialPayments: Payment[] = [];

const initialInventory: Inventory = {
  fullCans: 0,
  emptyCans: 0,
  damagedCans: 0,
  cansWithCustomers: 0,
  cansInDelivery: 0,
  refillInProcess: 0
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

  const lastRemoteData = useRef<string | null>(null);
  const snapshotReceivedRef = useRef(false);
  const isSaving = useRef(false);

  // Poll localStorage for ownerId/businessId changes to detect logins/logouts dynamically
  useEffect(() => {
    const checkOwner = () => {
      const id = safeGet('businessId') || safeGet('ownerId') || 'default_business';
      if (id !== ownerId && safeGet('userRole')) {
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
      setIsInitialized(true);
    };
    loadCache();
  }, []);

  // Set up Firebase onSnapshot listener when ownerId is active
  useEffect(() => {
    if (!ownerId) {
      snapshotReceivedRef.current = false;
      return;
    }

    snapshotReceivedRef.current = false;
    const docRef = doc(db, 'workspaces', ownerId);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      snapshotReceivedRef.current = true;
      if (!snapshot.exists()) return;

      const data = snapshot.data();
      const stringified = JSON.stringify({
        customers: data.customers || [],
        deliveries: data.deliveries || [],
        payments: data.payments || [],
        inventory: data.inventory || initialInventory,
        inventoryHistory: data.inventoryHistory || [],
        staff: data.staff || [],
        routes: data.routes || [],
        areas: data.areas || [],
        businessInfo: data.businessInfo || initialBusinessInfo
      });

      // Avoid trigger loop: do not trigger re-render if database contents match exactly what we have
      if (stringified === lastRemoteData.current) return;

      lastRemoteData.current = stringified;

      if (data.customers) setCustomers(data.customers);
      if (data.deliveries) setDeliveries(data.deliveries);
      if (data.payments) setPayments(data.payments);
      if (data.inventory) setInventory(data.inventory);
      if (data.inventoryHistory) setInventoryHistory(data.inventoryHistory);
      if (data.staff) setStaff(data.staff);
      if (data.routes) setRoutes(data.routes);
      if (data.areas) setAreas(data.areas);
      if (data.businessInfo) setBusinessInfo(data.businessInfo);

      // Save to localStorage too so it's fresh for next page load/reload
      localStorage.setItem('customers', JSON.stringify(data.customers || []));
      localStorage.setItem('deliveries', JSON.stringify(data.deliveries || []));
      localStorage.setItem('payments', JSON.stringify(data.payments || []));
      localStorage.setItem('inventory', JSON.stringify(data.inventory || initialInventory));
      localStorage.setItem('inventoryHistory', JSON.stringify(data.inventoryHistory || []));
      localStorage.setItem('staff', JSON.stringify(data.staff || []));
      localStorage.setItem('routes', JSON.stringify(data.routes || []));
      localStorage.setItem('areas', JSON.stringify(data.areas || []));
      localStorage.setItem('businessInfo', JSON.stringify(data.businessInfo || initialBusinessInfo));
    }, (error) => {
      console.error("Firestore real-time sync error:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [ownerId]);

  // Push local modifications to Firestore and update cache
  useEffect(() => {
    if (!isInitialized) return;
    if (ownerId && !snapshotReceivedRef.current) return; // Wait for server fetch to prevent overwriting with old cache

    const currentLocalStr = JSON.stringify({
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

    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('deliveries', JSON.stringify(deliveries));
    localStorage.setItem('payments', JSON.stringify(payments));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('inventoryHistory', JSON.stringify(inventoryHistory));
    localStorage.setItem('staff', JSON.stringify(staff));
    localStorage.setItem('routes', JSON.stringify(routes));
    localStorage.setItem('areas', JSON.stringify(areas));
    localStorage.setItem('businessInfo', JSON.stringify(businessInfo));

    // If local state exactly matches the remote data, skip writing
    if (currentLocalStr === lastRemoteData.current) return;

    lastRemoteData.current = currentLocalStr;

    const currentOwnerId = ownerId;

    const saveToFirestore = async () => {
      if (!currentOwnerId || isSaving.current) return;
      isSaving.current = true;
      try {
        await setDoc(doc(db, 'workspaces', currentOwnerId), {
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
      } catch (e) {
        console.error("Failed to sync state to workspace", e);
      } finally {
        isSaving.current = false;
      }
    };

    saveToFirestore();
  }, [customers, deliveries, payments, inventory, inventoryHistory, staff, routes, areas, businessInfo, isInitialized, ownerId]);


  const contextValue = React.useMemo(() => ({
    customers, setCustomers,
    deliveries, setDeliveries,
    payments, setPayments,
    inventory, setInventory,
    inventoryHistory, setInventoryHistory,
    staff, setStaff,
    routes, setRoutes,
    areas, setAreas,
    businessInfo, setBusinessInfo
  }), [customers, deliveries, payments, inventory, inventoryHistory, staff, routes, areas, businessInfo]);

  if (!isInitialized) return null; // Avoid hydration mismatch by waiting for mount

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
