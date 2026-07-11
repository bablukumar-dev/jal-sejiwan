import { collection, addDoc, updateDoc, doc, deleteDoc, setDoc, increment, writeBatch, getDoc } from 'firebase/firestore';
import { getFirebase } from '@/src/lib/firebase';
import { logActivity } from './activityLogger';

export interface AuditFields {
  businessId: string;
  ownerId: string;
  userId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Helpers to dynamically resolve correct paths for multi-tenant isolation
export const getSubcollectionRef = (db: any, businessId: string, collectionName: string) => {
  if (collectionName === 'businesses' || collectionName === 'users') {
    return collection(db, collectionName);
  }
  
  let subName = collectionName;
  if (collectionName === 'activity_logs' || collectionName === 'activityLogs') {
    subName = 'activityLogs';
  }
  
  return collection(db, 'businesses', businessId, subName);
};

export const getDocRef = (db: any, businessId: string, collectionName: string, docId: string) => {
  if (collectionName === 'businesses') {
    return doc(db, 'businesses', docId); // docId is businessId
  }
  if (collectionName === 'users') {
    return doc(db, 'users', docId); // docId is uid
  }
  if (collectionName === 'inventory') {
    return doc(db, 'businesses', businessId, 'settings', 'inventory');
  }
  
  let subName = collectionName;
  if (collectionName === 'activity_logs' || collectionName === 'activityLogs') {
    subName = 'activityLogs';
  }
  
  return doc(db, 'businesses', businessId, subName, docId);
};

export const createWithAudit = async (collectionName: string, data: any, currentUser: any) => {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not initialized");

  const businessId = currentUser?.businessId || (typeof window !== 'undefined' ? localStorage.getItem('businessId') : null);
  if (!businessId) throw new Error("Missing businessId in user context or local storage");

  const auditData = {
    ...data,
    businessId,
    ownerId: currentUser.role === 'owner' ? currentUser.uid : (currentUser.ownerId || businessId),
    userId: currentUser.uid,
    createdBy: currentUser.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const colRef = getSubcollectionRef(db, businessId, collectionName);
  const docRef = await addDoc(colRef, auditData);

  // Background log
  logActivity({
    module: collectionName.charAt(0).toUpperCase() + collectionName.slice(1),
    action: `${collectionName.slice(0, -1)} Created`,
    description: `Created ${collectionName.slice(0, -1)}: ${data.name || data.customerName || docRef.id}`,
    status: 'success',
    resourceType: collectionName,
    resourceId: docRef.id,
    resourceName: data.name || data.customerName,
    businessId,
    newValue: auditData
  }).catch(e => console.warn("Background log failed:", e));

  return docRef;
};

export const updateWithAudit = async (collectionName: string, docId: string, data: any, currentUser: any) => {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not initialized");

  const businessId = currentUser?.businessId || (typeof window !== 'undefined' ? localStorage.getItem('businessId') : null);
  if (!businessId) throw new Error("Missing businessId in user context or local storage");

  const docRef = getDocRef(db, businessId, collectionName, docId);
  
  // Try to fetch previous data for logging
  let previousValue = null;
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) previousValue = snap.data();
  } catch (e) {
    console.warn("Failed to fetch previous value for audit log", e);
  }

  const auditData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(docRef, auditData);

  // Background log
  logActivity({
    module: collectionName.charAt(0).toUpperCase() + collectionName.slice(1),
    action: `${collectionName.slice(0, -1)} Updated`,
    description: `Updated ${collectionName.slice(0, -1)}: ${previousValue?.name || previousValue?.customerName || docId}`,
    status: 'success',
    resourceType: collectionName,
    resourceId: docId,
    resourceName: previousValue?.name || previousValue?.customerName,
    businessId,
    previousValue,
    newValue: auditData
  }).catch(e => console.warn("Background log failed:", e));

  return docRef;
};

export const deleteWithAudit = async (collectionName: string, docId: string, currentUser?: any) => {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not initialized");

  const businessId = currentUser?.businessId || localStorage.getItem('businessId') || '';
  if (!businessId) throw new Error("Cannot delete without businessId context");

  const docRef = getDocRef(db, businessId, collectionName, docId);
  
  // Try to fetch previous data for logging
  let previousValue = null;
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) previousValue = snap.data();
  } catch (e) {
    console.warn("Failed to fetch previous value for audit log", e);
  }

  await deleteDoc(docRef);

  // Background log
  logActivity({
    module: collectionName.charAt(0).toUpperCase() + collectionName.slice(1),
    action: `${collectionName.slice(0, -1)} Deleted`,
    description: `Deleted ${collectionName.slice(0, -1)}: ${previousValue?.name || previousValue?.customerName || docId}`,
    status: 'warning',
    resourceType: collectionName,
    resourceId: docId,
    resourceName: previousValue?.name || previousValue?.customerName,
    businessId,
    previousValue
  }).catch(e => console.warn("Background log failed:", e));

  return true;
};

// Specialized helpers
export const addCustomer = (data: any, currentUser: any) => createWithAudit('customers', data, currentUser);
export const addDelivery = (data: any, currentUser: any) => createWithAudit('deliveries', data, currentUser);
export const addPayment = (data: any, currentUser: any) => createWithAudit('payments', data, currentUser);
export const addStaff = (data: any, currentUser: any) => createWithAudit('staff', data, currentUser);

export const updateDelivery = (docId: string, data: any, currentUser: any) => updateWithAudit('deliveries', docId, data, currentUser);
export const updateCustomer = (docId: string, data: any, currentUser: any) => updateWithAudit('customers', docId, data, currentUser);
export const updateBusiness = (docId: string, data: any, currentUser: any) => updateWithAudit('businesses', docId, data, currentUser);

export const batchAddDeliveries = async (deliveries: any[], currentUser: any) => {
  console.log("--- TRACE: batchAddDeliveries START ---");
  const { db } = getFirebase();
  if (!db) {
    console.error("--- TRACE FAILURE: Firestore not initialized in batchAddDeliveries ---");
    throw new Error("Firestore not initialized");
  }

  const businessId = currentUser?.businessId || (typeof window !== 'undefined' ? localStorage.getItem('businessId') : null);
  console.log("--- TRACE: Resolved BusinessId:", businessId);
  if (!businessId) {
    console.error("--- TRACE FAILURE: No businessId in batchAddDeliveries ---");
    throw new Error("Missing businessId in user context or local storage");
  }

  const batch = writeBatch(db);
  const results: string[] = [];
  const { logActivity } = await import('./activityLogger');

  console.log("--- TRACE: Preparing Batch for", deliveries.length, "deliveries ---");
  deliveries.forEach((d, index) => {
    const colRef = getSubcollectionRef(db, businessId, 'deliveries');
    const docRef = doc(colRef);
    const auditData = {
      ...d,
      businessId,
      ownerId: currentUser.role === 'owner' ? currentUser.uid : (currentUser.ownerId || businessId),
      userId: currentUser.uid,
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log(`--- TRACE: Batch Item [${index}] Path: businesses/${businessId}/deliveries/${docRef.id}`);
    console.log(`--- TRACE: Batch Item [${index}] Payload:`, JSON.stringify(auditData, null, 2));
    batch.set(docRef, auditData);
    results.push(docRef.id);
  });

  try {
    console.log("--- TRACE: Committing Batch... ---");
    await batch.commit();
    console.log("--- TRACE: Batch Commit SUCCESS ---");
  } catch (e: any) {
    console.error("--- TRACE FAILURE: Batch Commit Failed ---");
    console.error(e);
    throw e;
  }

  // Log batch delivery activity
  logActivity({
    module: 'Water Management',
    action: 'Batch Deliveries Created',
    description: `Created ${deliveries.length} new delivery records for ${businessId}`,
    status: 'success',
    resourceType: 'Delivery',
    newValue: { count: deliveries.length, ids: results }
  }).catch(err => console.error("--- TRACE: Batch delivery logging failed:", err));

  console.log("--- TRACE: batchAddDeliveries END. Returning IDs:", results);
  return results;
};

export const updateInventory = async (uid: string, changes: Partial<any>, currentUser?: any) => {
  console.log("--- TRACE: updateInventory START ---");
  console.log("UID:", uid, "Changes:", JSON.stringify(changes, null, 2));

  // If we are executing in the browser, route through our secure server-side API to bypass rule restrictions
  if (typeof window !== 'undefined') {
    console.log("--- TRACE: Executing in BROWSER. Using API route /api/inventory/update ---");
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        console.log("--- TRACE: ID Token obtained ---");
        
        // Transform client-side Firestore increment objects into JSON-safe serialized increments
        const apiChanges: any = {};
        for (const [key, val] of Object.entries(changes)) {
          console.log(`--- TRACE: Processing change key: ${key}, val type: ${typeof val}`);
          if (val && typeof val === 'object') {
             // Log structure to help debugging increment issue
            console.log(`--- TRACE: Detailed object structure for ${key}:`, Object.keys(val));

            if ('operand' in (val as any)) {
              apiChanges[key] = { _type: 'increment', value: (val as any).operand };
              console.log(`--- TRACE: Detected increment with operand: ${(val as any).operand}`);
            } else if (val.constructor?.name === 'FieldValue' || (val as any)._methodName === 'FieldValue.increment') {
              const operand = (val as any).operand || (val as any).h_ || (val as any).value || 0;
              apiChanges[key] = { _type: 'increment', value: operand };
              console.log(`--- TRACE: Detected increment via methodName. Resolved operand: ${operand}`);
            } else {
              apiChanges[key] = val;
            }
          } else {
            apiChanges[key] = val;
          }
        }

        console.log("--- TRACE: Final API Changes Payload:", JSON.stringify(apiChanges, null, 2));

        const response = await fetch('/api/inventory/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ changes: apiChanges })
        });
        
        const data = await response.json();
        console.log("--- TRACE: API Response Status:", response.status);
        console.log("--- TRACE: API Result Body:", JSON.stringify(data, null, 2));

        if (response.ok && data.success) {
          console.log("--- TRACE: updateInventory SUCCESS via API ---");
          return data;
        }
        console.warn("--- TRACE WARNING: Server-side inventory update returned error, falling back to client write:", data.error);
      } else {
        console.error("--- TRACE FAILURE: No authenticated user for inventory update ---");
      }
    } catch (e: any) {
      console.error("--- TRACE FAILURE: updateInventory API call failed, attempting client-side fallback ---");
      console.error(e.message);
    }
  }

  // Client-side fallback / test-environment execution
  console.log("--- TRACE: Executing CLIENT-SIDE / FALLBACK. Updating Firestore directly... ---");
  const { db } = getFirebase();
  if (!db) {
    console.error("--- TRACE FAILURE: Firestore not initialized ---");
    return;
  }

  const businessId = currentUser?.businessId || localStorage.getItem('businessId') || uid;
  const docRef = doc(db, 'businesses', businessId, 'settings', 'inventory');
  console.log(`--- TRACE: Firestore Inventory Path: businesses/${businessId}/settings/inventory`);

  try {
    console.log("--- TRACE: Updating Firestore using setDoc(merge:true)... ---");
    const result = await setDoc(docRef, {
      ...changes,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("--- TRACE: setDoc SUCCESS ---");
    return result;
  } catch (e: any) {
    console.error("--- TRACE FAILURE: setDoc failed ---");
    console.error(e);
    throw e;
  }
};
