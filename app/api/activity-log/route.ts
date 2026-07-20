import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '../../../src/lib/firebase-admin';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

const Timestamp = admin.firestore.Timestamp;
const FieldValue = admin.firestore.FieldValue;

export async function POST(req: NextRequest) {
  console.log("-----------------------------------------");
  console.log("[SERVER START] /api/activity-log");
  console.log("-----------------------------------------");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { logData, businessId } = body;
    if (!logData || !businessId) {
       return NextResponse.json({ error: "Missing logData or businessId" }, { status: 400 });
    }

    // FIREBASE ADMIN INIT & AUTH VERIFIED
    let decodedToken;
    try {
      const adminAuth = getAdminAuth();
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error("Missing Authorization header");
      }
      const idToken = authHeader.split('Bearer ')[1];
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      console.error("[AUTH VERIFIED] FAILED:", error.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strict Tenant Isolation Verification
    const adminDb = getAdminDb();
    try {
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      if (!userDoc.exists) {
        return NextResponse.json({ error: "Forbidden: User profile not found" }, { status: 403 });
      }
      const userData = userDoc.data();
      if (userData?.businessId !== businessId) {
        console.error(`[TENANT ISOLATION] Requester businessId ${userData?.businessId} does not match target businessId ${businessId}`);
        return NextResponse.json({ error: "Forbidden: Cross-tenant operation blocked" }, { status: 403 });
      }
    } catch (err: any) {
      console.error("[TENANT ISOLATION] Database error:", err.message);
      return NextResponse.json({ error: "Database error during isolation check" }, { status: 500 });
    }

// WRITE FIRESTORE
    try {
      
      const action = logData.action || '';
      const description = logData.description || '';
      const resourceId = logData.resourceId || logData.entityId || '';
      const userId = logData.userId || decodedToken.uid;

      // 1. Server-side In-memory Deduplication (captures millisecond-level parallel double-clicks)
      const dedupeKey = `${userId}:${action}:${resourceId}:${description}`;
      const dedupeHash = crypto.createHash('sha256').update(dedupeKey).digest('hex');
      
      if (globalThis.serverRecentLogsCache?.has(dedupeHash)) {
        console.log(`[DEDUPE SERVER IN-MEMORY] DUPLICATE DETECTED. Key: "${dedupeKey}". Skipping write.`);
        return NextResponse.json({ success: true, duplicate: true, message: "Duplicate log ignored" }, { status: 200 });
      }
      
      // Initialize global cache if not present
      if (!globalThis.serverRecentLogsCache) {
        globalThis.serverRecentLogsCache = new Set<string>();
        // Clean cache periodically
        setInterval(() => {
          globalThis.serverRecentLogsCache?.clear();
        }, 15000); // Clear every 15 seconds
      }
      globalThis.serverRecentLogsCache.add(dedupeHash);

      // 2. Server-side Firestore 15-second Lookback (covers slightly delayed duplicates)
      const now = new Date();
      const fifteenSecondsAgo = new Date(now.getTime() - 15000);
      const logsCol = adminDb.collection('businesses').doc(businessId).collection('activityLogs');
      
      let isDuplicate = false;
      try {
        const querySnapshot = await logsCol
          .where('timestamp', '>=', Timestamp.fromDate(fifteenSecondsAgo))
          .get();
          
        for (const doc of querySnapshot.docs) {
          const docData = doc.data();
          const docAction = docData.action || '';
          const docResourceId = docData.resourceId || docData.entityId || '';
          const docUserId = docData.userId || '';
          const docDescription = docData.description || '';
          
          if (docUserId === userId && docAction === action) {
            if (resourceId && docResourceId === resourceId) {
              isDuplicate = true;
              break;
            } else if (!resourceId && docDescription === description) {
              isDuplicate = true;
              break;
            }
          }
        }
      } catch (err: any) {
        console.warn("[DEDUPE SERVER] Query failed or index missing (falling back safely):", err.message);
      }

      if (isDuplicate) {
        console.log(`[DEDUPE SERVER] DUPLICATE DETECTED via Firestore. Action: "${action}" already logged. Skipping.`);
        return NextResponse.json({ success: true, duplicate: true, message: "Duplicate log ignored" }, { status: 200 });
      }

      const logRef = logsCol.doc();
      const timestamp = new Date();
      
      const finalLog = {
        ...logData,
        timestamp: Timestamp.fromDate(timestamp),
        serverTimestamp: FieldValue.serverTimestamp(),
        requestId: crypto.randomUUID(),
        performedByUID: decodedToken.uid,
        ip: req.ip || '0.0.0.0'
      };

      await logRef.set(finalLog);
      console.log("[WRITE FIRESTORE] SUCCESS. Log ID:", logRef.id);

      return NextResponse.json({ success: true, id: logRef.id }, { status: 200 });
    } catch (error: any) {
      console.error("[WRITE FIRESTORE] FAILED:", error.message);
      return NextResponse.json({ error: "Firestore write failed" }, { status: 500 });
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
