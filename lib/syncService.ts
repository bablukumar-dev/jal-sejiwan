import { db } from '@/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getUnsyncedDeliveries, markAsSynced } from './idb';
import { logActivity } from './activityLogger';

export const syncOfflineDeliveries = async (
  businessId: string, 
  onProgress?: (current: number, total: number) => void
) => {
  if (!businessId) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  const pending = await getUnsyncedDeliveries();
  if (pending.length === 0) return;

  console.log(`JalSejiwan Sync: Attempting to sync ${pending.length} offline deliveries...`);

  let processed = 0;
  const total = pending.length;
  
  if (onProgress) onProgress(0, total);

  for (const entry of pending) {
    try {
      const workspaceRef = doc(db, 'workspaces', businessId);
      const workspaceSnap = await getDoc(workspaceRef);

      if (workspaceSnap.exists()) {
        const data = workspaceSnap.data();
        
        // 1. Update deliveries - check if already updated
        const deliveryExists = (data.deliveries || []).find((d: any) => d.id === entry.deliveryId && d.status === 'delivered');
        if (deliveryExists) {
          await markAsSynced(entry.id);
          processed++;
          if (onProgress) onProgress(processed, total);
          continue;
        }

        const newDelivery = {
          id: entry.deliveryId,
          customerId: entry.customerId,
          customerName: entry.customerName || 'Offline Customer',
          date: entry.date,
          deliveredQty: entry.deliveredQty,
          returnedEmpty: entry.returnedEmpty,
          status: 'delivered',
          paymentReceived: entry.paymentAmount > 0,
          paymentAmount: entry.paymentAmount,
          paymentMode: entry.paymentMode,
          note: `SYNC-${entry.id} (Offline)`,
          staffId: 0,
          staffName: 'Staff',
          businessId: businessId
        };

        // 2. Update customers (due balance and empty balance)
        const updatedCustomers = (data.customers || []).map((c: any) => {
          if (c.id === entry.customerId) {
            const subtotal = entry.deliveredQty * entry.rate;
            let newDue = c.due;
            if (entry.paymentMode === 'Due') {
              newDue += subtotal;
            } else {
              newDue += (subtotal - entry.paymentAmount);
            }
            return {
              ...c,
              due: newDue,
              emptyBalance: (c.emptyBalance || 0) + entry.deliveredQty - entry.returnedEmpty,
              lastDelivery: entry.date
            };
          }
          return c;
        });

        // 3. Update Inventory
        const currentInventory = data.inventory || {
          fullCans: 0,
          emptyCans: 0,
          damagedCans: 0,
          cansWithCustomers: 0,
          cansInDelivery: 0,
          refillInProcess: 0
        };

        const updatedInventory = {
          ...currentInventory,
          cansWithCustomers: (currentInventory.cansWithCustomers || 0) + entry.deliveredQty - entry.returnedEmpty
        };

        // 4. Update Payments - check for duplicates
        const newPayments = [...(data.payments || [])];
        if (entry.paymentAmount > 0) {
          const paymentExists = newPayments.some((p: any) => 
            p.customerId === entry.customerId && 
            p.amount === entry.paymentAmount && 
            p.date === entry.date &&
            p.note?.includes(`DEL-${entry.deliveryId}`)
          );
          
          if (!paymentExists) {
            newPayments.unshift({
              id: Date.now() + Math.random(),
              customerId: entry.customerId,
              customerName: entry.customerName || 'Offline Customer',
              date: entry.date,
              amount: entry.paymentAmount,
              mode: entry.paymentMode,
              collectedBy: 'Staff (Offline Sync)',
              note: `DEL-${entry.deliveryId} (Offline Sync)`,
              businessId: businessId
            });
          }
        }

        // Apply all updates to Firestore
        await updateDoc(workspaceRef, {
          deliveries: (data.deliveries || []).map((d: any) => d.id === entry.deliveryId ? newDelivery : d),
          customers: updatedCustomers,
          inventory: updatedInventory,
          payments: newPayments
        });

        await markAsSynced(entry.id);
        
        logActivity(
          'delivery_synced',
          `Synced offline delivery for customer ID ${entry.customerId}`,
          { entry_id: entry.id, delivery_id: entry.deliveryId }
        );

        processed++;
        if (onProgress) onProgress(processed, total);
      }
    } catch (error) {
      console.error(`Sync failed for entry ${entry.id}:`, error);
      break; 
    }
  }
};
