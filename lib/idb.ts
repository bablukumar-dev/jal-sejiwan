import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DeliveryEntry {
  id: string; // Unique ID for sync tracking
  deliveryId: number;
  customerId: number;
  customerName?: string;
  deliveredQty: number;
  returnedEmpty: number;
  damagedQty: number;
  paymentMode: 'Cash' | 'UPI' | 'Due';
  paymentAmount: number;
  date: string;
  rate: number;
  timestamp: number;
  synced: boolean;
  businessId: string;
}

interface JalSejiwanDB extends DBSchema {
  'pending-deliveries': {
    key: string;
    value: DeliveryEntry;
    indexes: { 'by-synced': boolean };
  };
}

const DB_NAME = 'jalsejiwan-offline-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<JalSejiwanDB>> | null = null;

export const getDB = () => {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<JalSejiwanDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('pending-deliveries', {
          keyPath: 'id',
        });
        store.createIndex('by-synced', 'synced');
      },
    });
  }
  return dbPromise;
};

export const savePendingDelivery = async (entry: Omit<DeliveryEntry, 'synced' | 'timestamp' | 'id'>) => {
  const db = await getDB();
  if (!db) return;

  const fullEntry: DeliveryEntry = {
    ...entry,
    id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    synced: false,
    timestamp: Date.now(),
  };

  await db.put('pending-deliveries', fullEntry);
  return fullEntry.id;
};

export const getUnsyncedDeliveries = async () => {
  const db = await getDB();
  if (!db) return [];
  return db.getAllFromIndex('pending-deliveries', 'by-synced', false);
};

export const markAsSynced = async (id: string) => {
  const db = await getDB();
  if (!db) return;
  const entry = await db.get('pending-deliveries', id);
  if (entry) {
    entry.synced = true;
    await db.put('pending-deliveries', entry);
  }
};

export const deleteSyncedDeliveries = async () => {
  const db = await getDB();
  if (!db) return;
  const synced = await db.getAllFromIndex('pending-deliveries', 'by-synced', true);
  for (const entry of synced) {
    await db.delete('pending-deliveries', entry.id);
  }
};
