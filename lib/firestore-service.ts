import { collection, addDoc, updateDoc, doc, deleteDoc, setDoc, increment, writeBatch } from 'firebase/firestore';
import { getFirebase } from '@/src/lib/firebase';

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

  const businessId = currentUser?.businessId;
  if (!businessId) throw new Error("Missing businessId in user context");

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
  return await addDoc(colRef, auditData);
};

export const updateWithAudit = async (collectionName: string, docId: string, data: any, currentUser: any) => {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not initialized");

  const businessId = currentUser?.businessId;
  if (!businessId) throw new Error("Missing businessId in user context");

  const auditData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const docRef = getDocRef(db, businessId, collectionName, docId);
  return await updateDoc(docRef, auditData);
};

export const deleteWithAudit = async (collectionName: string, docId: string) => {
  // Keeping for compatibility, though we don't use direct deletion usually
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not initialized");

  const businessId = localStorage.getItem('businessId') || '';
  const docRef = getDocRef(db, businessId, collectionName, docId);
  return await deleteDoc(docRef);
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
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not initialized");

  const businessId = currentUser?.businessId;
  if (!businessId) throw new Error("Missing businessId in user context");

  const batch = writeBatch(db);
  const results: string[] = [];

  deliveries.forEach(d => {
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
    batch.set(docRef, auditData);
    results.push(docRef.id);
  });

  await batch.commit();
  return results;
};

export const updateInventory = async (uid: string, changes: Partial<any>, currentUser?: any) => {
  const { db } = getFirebase();
  if (!db) return;

  const businessId = currentUser?.businessId || localStorage.getItem('businessId') || uid;
  const docRef = doc(db, 'businesses', businessId, 'settings', 'inventory');
  return await updateDoc(docRef, {
    ...changes,
    updatedAt: new Date().toISOString()
  });
};
