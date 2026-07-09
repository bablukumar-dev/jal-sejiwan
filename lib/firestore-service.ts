import { collection, addDoc, updateDoc, doc, deleteDoc, setDoc, increment, writeBatch } from 'firebase/firestore';
import { getFirebase } from '@/src/lib/firebase';

export interface AuditFields {
  businessId: string;
  ownerId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const createWithAudit = async (collectionName: string, data: any, currentUser: any) => {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not initialized");

  const auditData = {
    ...data,
    businessId: currentUser.businessId,
    ownerId: currentUser.role === 'owner' ? currentUser.uid : (currentUser.ownerId || currentUser.businessId),
    createdBy: currentUser.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return await addDoc(collection(db, collectionName), auditData);
};

export const updateWithAudit = async (collectionName: string, docId: string, data: any, currentUser: any) => {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not initialized");

  const auditData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const docRef = doc(db, collectionName, docId);
  return await updateDoc(docRef, auditData);
};

export const deleteWithAudit = async (collectionName: string, docId: string) => {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore not initialized");

  const docRef = doc(db, collectionName, docId);
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

  const batch = writeBatch(db);
  const results: string[] = [];

  deliveries.forEach(d => {
    const docRef = doc(collection(db, 'deliveries'));
    const auditData = {
      ...d,
      businessId: currentUser.businessId,
      ownerId: currentUser.role === 'owner' ? currentUser.uid : (currentUser.ownerId || currentUser.businessId),
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

export const updateInventory = async (businessId: string, changes: Partial<any>) => {
  const { db } = getFirebase();
  if (!db) return;

  const docRef = doc(db, 'inventory', businessId);
  return await updateDoc(docRef, {
    ...changes,
    updatedAt: new Date().toISOString()
  });
};
