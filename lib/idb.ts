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
  try {
    const db = await getDB();
    if (!db) return [];
    
    // Validate store exists before calling getAllFromIndex
    if (!db.objectStoreNames.contains('pending-deliveries')) {
      console.warn("Object store 'pending-deliveries' not found.");
      return [];
    }

    // Attempt to use index first as it's more efficient
    try {
      return await db.getAllFromIndex('pending-deliveries', 'by-synced', false);
    } catch (indexError) {
      console.warn("IndexedDB index query failed, falling back to manual filter:", indexError);
      // Fallback: get all and filter manually
      const all = await db.getAll('pending-deliveries');
      return all.filter(entry => entry.synced === false);
    }
  } catch (error) {
    console.error("IndexedDB getUnsyncedDeliveries error:", error);
    return [];
  }
};

export const markAsSynced = async (id: string) => {
  if (!id) return;
  try {
    const db = await getDB();
    if (!db) return;
    
    if (!db.objectStoreNames.contains('pending-deliveries')) {
      return;
    }

    const entry = await db.get('pending-deliveries', id);
    if (entry) {
      entry.synced = true;
      await db.put('pending-deliveries', entry);
    }
  } catch (error) {
    console.error("IndexedDB markAsSynced error:", error);
  }
};

export const deleteSyncedDeliveries = async () => {
  try {
    const db = await getDB();
    if (!db) return;
    
    if (!db.objectStoreNames.contains('pending-deliveries')) {
      return;
    }

    let synced = [];
    try {
      synced = await db.getAllFromIndex('pending-deliveries', 'by-synced', true);
    } catch (indexError) {
      console.warn("IndexedDB index query for deletion failed, falling back to manual filter:", indexError);
      const all = await db.getAll('pending-deliveries');
      synced = all.filter(entry => entry.synced === true);
    }

    if (synced && Array.isArray(synced)) {
      for (const entry of synced) {
        if (entry && entry.id) {
          await db.delete('pending-deliveries', entry.id);
        }
      }
    }
  } catch (error) {
    console.error("IndexedDB deleteSyncedDeliveries error:", error);
  }
};
