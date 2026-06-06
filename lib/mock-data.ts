import { User, Customer, Delivery, Payment, Inventory, Staff } from './types';

export const currentUser: User = {
  id: 'u1',
  name: 'Rajesh Ji',
  role: 'owner',
  phone: '+919876543210',
  businessId: 'default_business',
};

export const mockCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Anil Kumar',
    phone: '+919876543211',
    address: 'Sector 45, Green Park',
    area: 'Sector 45',
    type: 'Home',
    dueAmount: 350,
    emptyCans: 2,
    lastDelivery: '2023-10-24',
  },
  {
    id: 'c2',
    name: 'Shanti Niketan Offices',
    phone: '+919876543212',
    address: 'Plot 12, Industrial Area Ph-1',
    area: 'Industrial Area',
    type: 'Office',
    dueAmount: 0,
    emptyCans: 5,
    lastDelivery: '2023-10-23',
  },
  {
    id: 'c3',
    name: 'Dr. Verma Residence',
    phone: '+919876543213',
    address: 'H-Block, Sarita Vihar',
    area: 'Sarita Vihar',
    type: 'Home',
    dueAmount: 1200,
    emptyCans: 0,
    lastDelivery: '2023-10-20',
  },
  {
    id: 'c4',
    name: 'Priya Sharma',
    phone: '+919876543214',
    address: 'Sector 18, Metro Road',
    area: 'Sector 18',
    type: 'Home',
    dueAmount: 0,
    emptyCans: 1,
    lastDelivery: '2023-10-24',
  },
  {
    id: 'c5',
    name: 'Gopal Kanda Sweets',
    phone: '+919876543215',
    address: 'Main Market, Shop 42',
    area: 'Main Market',
    type: 'Office',
    dueAmount: 4500,
    emptyCans: 12,
    lastDelivery: '2023-10-22',
  },
];

export const mockInventory: Inventory = {
  fullCans: 450,
  emptyCans: 128,
  damagedCans: 4,
  inMarket: 2105,
};

export const mockStaff: Staff[] = [
  {
    id: 's1',
    name: 'Rajesh Kumar',
    phone: '+919876543210',
    route: 'Sector 45 - Gurgaon',
    status: 'Active',
    deliveriesMTD: 1240,
  },
  {
    id: 's2',
    name: 'Sunita Sharma',
    phone: '+919123456789',
    route: 'DLF Phase 3',
    status: 'Inactive',
    deliveriesMTD: 0,
  },
  {
    id: 's3',
    name: 'Arjun Singh',
    phone: '+918822113344',
    route: 'Sohna Road Cluster',
    status: 'Active',
    deliveriesMTD: 892,
  },
];
