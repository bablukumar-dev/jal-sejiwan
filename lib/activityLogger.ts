import { getFirebase } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ActivityLog {
  log_id?: string; // Keeping for backward compatibility with UI
  activityId?: string;
  timestamp: any;
  userId: string;
  userName: string;
  email: string;
  role: string;
  businessId: string; // Mapping organizationId to businessId
  module: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  previousValue?: any;
  newValue?: any;
  status: 'success' | 'warning' | 'error' | 'info';
  success: boolean;
  failureReason?: string;
  device?: string;
  browser?: string;
  ipAddress?: string;
  sessionId?: string;
  requestId?: string;
  description: string; // Required for the current UI
  action_type?: string; // Required for current UI filtering

  // Specific schema properties requested by the user
  performedByUID?: string;
  performedByName?: string;
  performedByRole?: string;
  entity?: string;
  entityId?: string;
  ip?: string;
}

/**
 * Silently logs an action in the background.
 * It will not throw errors or disrupt the main app execution.
 * Supports both new object-based signature and old positional signature for backward compatibility.
 */
export async function logActivity(
  paramsOrAction: string | {
    module: string;
    action: string;
    description: string;
    status?: 'success' | 'warning' | 'error' | 'info';
    resourceType?: string;
    resourceId?: string;
    resourceName?: string;
    businessId?: string;
    previousValue?: any;
    newValue?: any;
    failureReason?: string;
    metadata?: any;
  },
  legacyDescription?: string,
  legacyMetadata?: any
): Promise<void> {
  try {
    const { auth, db } = getFirebase();
    if (!auth || !db || !auth.currentUser) {
      console.warn("Activity Logger: No auth or db available, or user not logged in.");
      return;
    }

    let finalParams: any = {};
    if (typeof paramsOrAction === 'string') {
      // Legacy signature handling
      finalParams = {
        module: 'General',
        action: paramsOrAction,
        description: legacyDescription || paramsOrAction,
        metadata: legacyMetadata,
        status: 'success'
      };
    } else {
      finalParams = paramsOrAction;
    }

    const user = auth.currentUser;
    const role = localStorage.getItem('userRole') || 'unknown';
    // Use businessId from finalParams if provided, else fallback to localStorage
    let businessId = finalParams.businessId || localStorage.getItem('businessId') || '';
    if (!businessId && user) {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          businessId = userDoc.data()?.businessId || '';
          if (businessId && typeof window !== 'undefined') {
            localStorage.setItem('businessId', businessId);
          }
        }
      } catch (err) {
        console.error("Activity Logger failed to fetch user businessId:", err);
      }
    }
    const userName = user.displayName || localStorage.getItem('userName') || 'User';

    console.log("[ActivityLogger] Logging activity. businessId:", businessId, "user:", user.uid);

    const activityId = crypto.randomUUID();
    
    const logData: Omit<ActivityLog, 'log_id'> = {
      activityId,
      timestamp: serverTimestamp(),
      userId: user.uid,
      userName: userName,
      email: user.email || '',
      role: role,
      businessId: businessId,
      module: finalParams.module,
      action: finalParams.action,
      resourceType: finalParams.resourceType,
      resourceId: finalParams.resourceId,
      resourceName: finalParams.resourceName,
      previousValue: finalParams.previousValue,
      newValue: finalParams.newValue || finalParams.metadata,
      status: finalParams.status || 'success',
      success: finalParams.status !== 'error',
      failureReason: finalParams.failureReason,
      description: finalParams.description,
      action_type: finalParams.action.toLowerCase().replace(/\s+/g, '_'),
      device: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      browser: typeof navigator !== 'undefined' ? navigator.appName : 'unknown',
      sessionId: localStorage.getItem('sessionId') || 'unknown',

      // Specific schema fields requested by the user
      performedByUID: user.uid,
      performedByName: userName,
      performedByRole: role,
      entity: finalParams.resourceType || finalParams.module,
      entityId: finalParams.resourceId || '',
      ip: '127.0.0.1'
    };

    if (!businessId) {
      console.warn("Activity Logger: businessId not found in localStorage, cannot log to subcollection.");
      return;
    }

    // Write to /businesses/{businessId}/activityLogs subcollection
    addDoc(collection(db, 'businesses', businessId, 'activityLogs'), logData).catch(err => {
      console.error("Failed to write activity log:", err);
    });

  } catch (error) {
    console.error("Activity Logger Error:", error);
  }
}
