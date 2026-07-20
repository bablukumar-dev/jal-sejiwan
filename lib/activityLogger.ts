import { getFirebase } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Client-side in-memory deduplication cache
// Key: string (userId:action:resourceId:description)
// Value: number (timestamp in milliseconds)
const recentLogsCache = new Map<string, number>();

// Clean up stale logs from the cache every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of recentLogsCache.entries()) {
      if (now - timestamp > 30000) { // 30s TTL
        recentLogsCache.delete(key);
      }
    }
  }, 30000);
}

// Safe UUID Generator for secure/non-secure contexts
const generateUUID = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'act_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
};

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
    console.log("--- TRACE: logActivity START ---");
    const { auth, db } = getFirebase();
    if (!auth || !db || !auth.currentUser) {
      console.warn("--- TRACE FAILURE: Activity Logger: No auth or db available, or user not logged in. ---");
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

    console.log("--- TRACE: Final Params:", JSON.stringify(finalParams, null, 2));

    const user = auth.currentUser;
    const role = localStorage.getItem('userRole') || 'unknown';
    // Use businessId from finalParams if provided, else fallback to localStorage
    let businessId = String(finalParams.businessId || localStorage.getItem('businessId') || '').trim();
    
    console.log("--- TRACE: Initial businessId from params/localStorage:", businessId);

    // CRITICAL FIX: If businessId is still missing, attempt to fetch it from the user document synchronously if possible,
    // but we can't do sync fetch in JS easily. We rely on the existing async fetch below.

    if (!businessId && user) {
      try {
        console.log("--- TRACE: businessId missing, fetching from users/" + user.uid + " ---");
        const { doc, getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          businessId = userData?.businessId || userData?.organizationId || '';
          console.log("--- TRACE: Fetched businessId from Firestore:", businessId);
          if (businessId && typeof window !== 'undefined') {
            localStorage.setItem('businessId', businessId);
          }
        } else {
          console.warn("--- TRACE FAILURE: User document not found in Firestore for businessId lookup. Is the collection correct? ---");
        }
      } catch (err: any) {
        console.error("--- TRACE FAILURE: Activity Logger failed to fetch user businessId:", err.message);
      }
    }
    const userName = user.displayName || localStorage.getItem('userName') || 'User';

    if (!businessId) {
      console.warn("--- TRACE FAILURE: Activity Logger: businessId still not found after lookup. Log Data:", JSON.stringify(finalParams));
      return;
    }

    console.log("--- TRACE: businessId used for write:", businessId);
    console.log("--- TRACE: user UID:", user.uid);

    // 1. Client-side In-memory Deduplication (Strict 15s window)
    const action = finalParams.action || '';
    const description = finalParams.description || finalParams.action || '';
    const resourceId = finalParams.resourceId || '';
    const userId = user.uid;

    const dedupeKey = `${userId}:${action}:${resourceId}:${description}`;
    const now = Date.now();
    
    if (recentLogsCache.has(dedupeKey)) {
      const prevTime = recentLogsCache.get(dedupeKey) || 0;
      if (now - prevTime < 15000) { // 15 seconds deduplication window
        console.warn(`[DEDUPE CLIENT] Duplicate activity log blocked within 15s. Key: ${dedupeKey}`);
        return;
      }
    }
    recentLogsCache.set(dedupeKey, now);

    const activityId = generateUUID();
    
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
      description: finalParams.description || finalParams.action,
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
      console.warn("--- TRACE FAILURE: Activity Logger: businessId not found, cannot log to subcollection. ---");
      return;
    }

    const path = `businesses/${businessId}/activityLogs`;
    console.log("[WRITE START] Action:", finalParams.action);
    console.log("[WRITE PATH]", path);
    console.log("[WRITE PAYLOAD]", JSON.stringify(logData, null, 2));

    // If in browser, try server-side logging first for better reliability and bypass client network issues
    if (typeof window !== 'undefined') {
      console.log("--- TRACE: Executing in BROWSER. Attempting API logging... ---");
      try {
        const idToken = await user.getIdToken();
        
        // CRITICAL: Remove timestamp sentinel before stringifying for API
        // The API route handles setting the server-side timestamp
        const { timestamp, ...logDataForApi } = logData;

        const response = await fetch('/api/activity-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ logData: logDataForApi, businessId })
        });
        
        if (response.ok) {
           console.log("[API LOG SUCCESS]");
           return;
        }
        const errText = await response.text();
        console.warn("[API LOG FAILED] Status:", response.status, "Error:", errText);
        console.warn("[API LOG FAILED] Falling back to direct Firestore");
      } catch (e) {
        console.warn("[API LOG ERROR]", e);
      }
    }

    // Write to /businesses/{businessId}/activityLogs subcollection
    // 2. Client-side Firestore query deduplication (as fallback safety if API fails)
    try {
      const { query, collection: fsCollection, where, getDocs, Timestamp: fsTimestamp } = await import('firebase/firestore');
      const fifteenSecondsAgo = new Date(Date.now() - 15000);
      const q = query(
        fsCollection(db, 'businesses', businessId, 'activityLogs'),
        where('userId', '==', user.uid),
        where('action', '==', action),
        where('timestamp', '>=', fsTimestamp.fromDate(fifteenSecondsAgo))
      );
      const snap = await getDocs(q);
      let clientDedupe = false;
      for (const d of snap.docs) {
        const dData = d.data();
        const dResId = dData.resourceId || dData.entityId || '';
        const dDesc = dData.description || '';
        if (resourceId && dResId === resourceId) {
          clientDedupe = true;
          break;
        } else if (!resourceId && dDesc === description) {
          clientDedupe = true;
          break;
        }
      }
      if (clientDedupe) {
        console.warn(`[DEDUPE CLIENT DIRECT] Duplicate detected in Firestore via query. Skipping addDoc.`);
        return;
      }
    } catch (err: any) {
      console.warn(`[DEDUPE CLIENT DIRECT] Firestore check bypassed or index missing:`, err.message);
    }

    addDoc(collection(db, 'businesses', businessId, 'activityLogs'), logData)
      .then((docRef) => {
        console.log("[WRITE SUCCESS] Path:", path);
        console.log("[WRITE DOC ID]", docRef.id);
      })
      .catch(err => {
        console.error("[WRITE FAILED] Error:", err.message);
        console.error("--- TRACE FAILURE: Failed to write activity log:", err);
      });

  } catch (error: any) {
    console.error("--- TRACE FAILURE: Activity Logger Exception:", error);
    console.error(error.stack);
  }
}
