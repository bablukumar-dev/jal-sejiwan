/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  active: boolean;
};

export type BusinessInfo = {
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  defaultRate: number;
  canSize: string;
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

const initialCustomers: Customer[] = [
  { id: 1, name: "Sharma General Store", phone: "9876543210", address: "Shop No. 5, Main Market, Sector 7", area: "Sector 7", route: "Route A", type: "Shop", deliveryType: "Daily", defaultQty: 3, rate: 30, due: 2100, emptyBalance: 4, active: true, lastDelivery: "2026-03-26", notes: "Payment monthly karte hain" },
  { id: 2, name: "Gupta Ji Ka Ghar", phone: "9988776655", address: "House No. 12, Gali 3, Sector 5", area: "Sector 5", route: "Route A", type: "Home", deliveryType: "Alternate", defaultQty: 1, rate: 25, due: 450, emptyBalance: 2, active: true, lastDelivery: "2026-03-25", notes: "" },
  { id: 3, name: "Verma Office", phone: "9871234560", address: "Office No. 201, Business Park, Sector 3", area: "Sector 3", route: "Route B", type: "Office", deliveryType: "Daily", defaultQty: 5, rate: 28, due: 0, emptyBalance: 0, active: true, lastDelivery: "2026-03-27", notes: "Weekdays only" },
  { id: 4, name: "Patel Dairy", phone: "9765432109", address: "Dairy Road, Near Temple, Main Road", area: "Main Road", route: "Route B", type: "Shop", deliveryType: "Daily", defaultQty: 4, rate: 30, due: 1800, emptyBalance: 6, active: true, lastDelivery: "2026-03-26", notes: "" },
  { id: 5, name: "Singh Sahab Ka Ghar", phone: "9654321098", address: "House No. 45, Block C, Colony Road", area: "Colony Road", route: "Route A", type: "Home", deliveryType: "Daily", defaultQty: 2, rate: 25, due: 750, emptyBalance: 3, active: true, lastDelivery: "2026-03-27", notes: "Subah 8 baje dena" },
  { id: 6, name: "Mehta Medical Store", phone: "9543210987", address: "Medical Square, Near Hospital", area: "Sector 5", route: "Route C", type: "Shop", deliveryType: "Daily", defaultQty: 2, rate: 30, due: 600, emptyBalance: 1, active: true, lastDelivery: "2026-03-26", notes: "" },
  { id: 7, name: "Yadav Ji", phone: "9432109876", address: "House No. 8, Gali 1, Sector 7", area: "Sector 7", route: "Route A", type: "Home", deliveryType: "Alternate", defaultQty: 1, rate: 25, due: 0, emptyBalance: 1, active: true, lastDelivery: "2026-03-25", notes: "" },
  { id: 8, name: "Jain Sweets", phone: "9321098765", address: "Sweet Shop, Main Market", area: "Main Road", route: "Route B", type: "Shop", deliveryType: "Daily", defaultQty: 6, rate: 28, due: 3200, emptyBalance: 8, active: true, lastDelivery: "2026-03-26", notes: "Bohot zyada can rakhte hain" },
  { id: 9, name: "Agarwal Residency", phone: "9210987654", address: "Flat No. 302, Tower B, Sector 3", area: "Sector 3", route: "Route C", type: "Home", deliveryType: "On-demand", defaultQty: 2, rate: 25, due: 200, emptyBalance: 0, active: true, lastDelivery: "2026-03-20", notes: "Call karke aana" },
  { id: 10, name: "Mishra Ji School", phone: "9109876543", address: "Near Park, Sector 5", area: "Sector 5", route: "Route C", type: "Office", deliveryType: "Daily", defaultQty: 8, rate: 28, due: 0, emptyBalance: 2, active: true, lastDelivery: "2026-03-27", notes: "Only on working days" },
  { id: 11, name: "Tiwari General Store", phone: "9098765432", address: "Shop No. 12, Colony Road Market", area: "Colony Road", route: "Route B", type: "Shop", deliveryType: "Daily", defaultQty: 3, rate: 30, due: 900, emptyBalance: 3, active: true, lastDelivery: "2026-03-26", notes: "" },
  { id: 12, name: "Dubey Bhavan", phone: "9087654321", address: "House No. 23, Block A, Sector 7", area: "Sector 7", route: "Route A", type: "Home", deliveryType: "Daily", defaultQty: 2, rate: 25, due: 1250, emptyBalance: 5, active: false, lastDelivery: "2026-03-10", notes: "Currently inactive" },
  { id: 13, name: "Pandey Restaurant", phone: "9876012345", address: "Food Street, Near Bus Stand", area: "Main Road", route: "Route B", type: "Shop", deliveryType: "Daily", defaultQty: 10, rate: 28, due: 4500, emptyBalance: 12, active: true, lastDelivery: "2026-03-26", notes: "Highest volume customer" },
  { id: 14, name: "Srivastava Home", phone: "9765012345", address: "House No. 67, Sector 3", area: "Sector 3", route: "Route C", type: "Home", deliveryType: "Alternate", defaultQty: 1, rate: 25, due: 0, emptyBalance: 0, active: true, lastDelivery: "2026-03-25", notes: "" },
  { id: 15, name: "Chaurasia Hotel", phone: "9654012345", address: "Hotel Road, Near Railway Station", area: "Main Road", route: "Route B", type: "Shop", deliveryType: "Daily", defaultQty: 8, rate: 30, due: 2800, emptyBalance: 9, active: true, lastDelivery: "2026-03-26", notes: "Early morning delivery" }
];

const initialDeliveries: Delivery[] = [
  { id: 1, customerId: 1, customerName: "Sharma General Store", date: "2026-03-27", deliveredQty: 3, returnedEmpty: 2, status: "Delivered", paymentReceived: true, paymentAmount: 90, paymentMode: "Cash", note: "", staffId: 1, staffName: "Ravi Kumar", priority: 'Medium' },
  { id: 2, customerId: 2, customerName: "Gupta Ji Ka Ghar", date: "2026-03-27", deliveredQty: 0, returnedEmpty: 0, status: "Pending", paymentReceived: false, paymentAmount: 0, paymentMode: "", note: "", staffId: 1, staffName: "Ravi Kumar", priority: 'High' },
  { id: 3, customerId: 4, customerName: "Patel Dairy", date: "2026-03-27", deliveredQty: 0, returnedEmpty: 0, status: "Pending", paymentReceived: false, paymentAmount: 0, paymentMode: "", note: "", staffId: 1, staffName: "Ravi Kumar", priority: 'Medium' },
  { id: 4, customerId: 5, customerName: "Singh Sahab Ka Ghar", date: "2026-03-27", deliveredQty: 2, returnedEmpty: 1, status: "Delivered", paymentReceived: false, paymentAmount: 0, paymentMode: "", note: "Empty kal denge", staffId: 1, staffName: "Ravi Kumar", priority: 'Medium' },
  { id: 5, customerId: 6, customerName: "Mehta Medical Store", date: "2026-03-27", deliveredQty: 0, returnedEmpty: 0, status: "Skipped", paymentReceived: false, paymentAmount: 0, paymentMode: "", note: "Shop band thi", staffId: 1, staffName: "Ravi Kumar", priority: 'Low' },
  { id: 6, customerId: 8, customerName: "Jain Sweets", date: "2026-03-27", deliveredQty: 0, returnedEmpty: 0, status: "Pending", paymentReceived: false, paymentAmount: 0, paymentMode: "", note: "", staffId: 2, staffName: "Suresh Yadav", priority: 'High' },
  { id: 7, customerId: 13, customerName: "Pandey Restaurant", date: "2026-03-27", deliveredQty: 0, returnedEmpty: 0, status: "Pending", paymentReceived: false, paymentAmount: 0, paymentMode: "", note: "", staffId: 2, staffName: "Suresh Yadav", priority: 'High' },
  { id: 8, customerId: 15, customerName: "Chaurasia Hotel", date: "2026-03-27", deliveredQty: 8, returnedEmpty: 5, status: "Delivered", paymentReceived: true, paymentAmount: 240, paymentMode: "UPI", note: "", staffId: 2, staffName: "Suresh Yadav", priority: 'Medium' },
  { id: 9, customerId: 10, customerName: "Mishra Ji School", date: "2026-03-27", deliveredQty: 8, returnedEmpty: 6, status: "Delivered", paymentReceived: true, paymentAmount: 224, paymentMode: "Bank", note: "", staffId: 2, staffName: "Suresh Yadav", priority: 'Medium' },
  { id: 10, customerId: 3, customerName: "Verma Office", date: "2026-03-27", deliveredQty: 5, returnedEmpty: 3, status: "Delivered", paymentReceived: true, paymentAmount: 140, paymentMode: "UPI", note: "", staffId: 1, staffName: "Ravi Kumar", priority: 'Medium' }
];

const initialPayments: Payment[] = [
  { id: 1, customerId: 13, customerName: "Pandey Restaurant", date: "2026-03-27", amount: 1000, mode: "Cash", collectedBy: "Ravi Kumar", note: "Partial payment" },
  { id: 2, customerId: 8, customerName: "Jain Sweets", date: "2026-03-27", amount: 840, mode: "UPI", collectedBy: "Ravi Kumar", note: "" },
  { id: 3, customerId: 1, customerName: "Sharma General Store", date: "2026-03-26", amount: 500, mode: "Cash", collectedBy: "Ravi Kumar", note: "Monthly payment" },
  { id: 4, customerId: 15, customerName: "Chaurasia Hotel", date: "2026-03-26", amount: 1200, mode: "Cash", collectedBy: "Suresh Yadav", note: "" },
  { id: 5, customerId: 4, customerName: "Patel Dairy", date: "2026-03-25", amount: 600, mode: "UPI", collectedBy: "Ravi Kumar", note: "" },
  { id: 6, customerId: 11, customerName: "Tiwari General Store", date: "2026-03-25", amount: 300, mode: "Cash", collectedBy: "Suresh Yadav", note: "" },
  { id: 7, customerId: 5, customerName: "Singh Sahab Ka Ghar", date: "2026-03-24", amount: 250, mode: "Cash", collectedBy: "Ravi Kumar", note: "" },
  { id: 8, customerId: 6, customerName: "Mehta Medical Store", date: "2026-03-24", amount: 180, mode: "UPI", collectedBy: "Ravi Kumar", note: "" }
];

const initialInventory: Inventory = {
  fullCans: 240,
  emptyCans: 180,
  damagedCans: 12,
  cansWithCustomers: 95,
  cansInDelivery: 30,
  refillInProcess: 20
};

const initialInventoryHistory: InventoryHistory[] = [
  { id: 1, date: "2026-03-27", type: "Stock In", qty: 50, source: "Refill Plant", note: "Morning stock" },
  { id: 2, date: "2026-03-27", type: "Dispatch", qty: 30, source: "Ravi Kumar - Route A", note: "" },
  { id: 3, date: "2026-03-26", type: "Return", qty: 25, source: "Ravi Kumar", note: "End of day return" },
  { id: 4, date: "2026-03-26", type: "Damage", qty: 2, source: "Delivery damage", note: "Can broken during delivery" }
];

const initialStaff: Staff[] = [
  { id: 1, name: "Ravi Kumar", phone: "9112233445", role: "Delivery Staff", route: "Route A", pin: "1234", active: true },
  { id: 2, name: "Suresh Yadav", phone: "9556677889", role: "Delivery Staff", route: "Route B", pin: "5678", active: true },
  { id: 3, name: "Mohan Singh", phone: "9334455667", role: "Inventory", route: "Warehouse", pin: "9012", active: true }
];

const initialRoutes = ["Route A", "Route B", "Route C"];
const initialAreas = ["Sector 3", "Sector 5", "Sector 7", "Main Road", "Colony Road"];
const initialBusinessInfo: BusinessInfo = {
  name: "Shree Jal Seva",
  ownerName: "Rakesh Gupta",
  phone: "9876543210",
  address: "Sector 7, Main Market",
  defaultRate: 28,
  canSize: "20 Litre"
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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedCustomers = localStorage.getItem('customers');
      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      
      const storedDeliveries = localStorage.getItem('deliveries');
      if (storedDeliveries) setDeliveries(JSON.parse(storedDeliveries));
      
      const storedPayments = localStorage.getItem('payments');
      if (storedPayments) setPayments(JSON.parse(storedPayments));
      
      const storedInventory = localStorage.getItem('inventory');
      if (storedInventory) setInventory(JSON.parse(storedInventory));
      
      const storedHistory = localStorage.getItem('inventoryHistory');
      if (storedHistory) setInventoryHistory(JSON.parse(storedHistory));
      
      const storedStaff = localStorage.getItem('staff');
      if (storedStaff) setStaff(JSON.parse(storedStaff));
      
      const storedRoutes = localStorage.getItem('routes');
      if (storedRoutes) setRoutes(JSON.parse(storedRoutes));
      
      const storedAreas = localStorage.getItem('areas');
      if (storedAreas) setAreas(JSON.parse(storedAreas));
      
      const storedBusinessInfo = localStorage.getItem('businessInfo');
      if (storedBusinessInfo) setBusinessInfo(JSON.parse(storedBusinessInfo));
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage when state changes
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
  }, [customers, deliveries, payments, inventory, inventoryHistory, staff, routes, areas, businessInfo, isInitialized]);

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
