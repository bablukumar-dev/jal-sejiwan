export type Role = 'owner' | 'staff' | 'manager';

export interface User {
  id: string;
  name: string;
  role: Role;
  phone: string;
  businessId?: string;
}

export interface Business {
  businessId: string;
  businessName: string;
  createdAt: string;
  ownerId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  area: string;
  type: 'Home' | 'Office';
  dueAmount: number;
  emptyCans: number;
  lastDelivery: string;
}

export interface Delivery {
  id: string;
  customerId: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Skipped';
  cansDelivered: number;
  emptiesReturned: number;
  amountCollected: number;
}

export interface Payment {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  mode: 'Cash' | 'UPI';
}

export interface Inventory {
  fullCans: number;
  emptyCans: number;
  damagedCans: number;
  inMarket: number;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  route: string;
  status: 'Active' | 'Inactive';
  deliveriesMTD: number;
}
