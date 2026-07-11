import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '../../../src/lib/firebase-admin';

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

    // WRITE FIRESTORE
    try {
      const adminDb = getAdminDb();
      const logRef = adminDb.collection('businesses').doc(businessId).collection('activityLogs').doc();
      const timestamp = new Date();
      
      const finalLog = {
        ...logData,
        timestamp: adminDb.firestore.Timestamp.fromDate(timestamp),
        serverTimestamp: adminDb.firestore.FieldValue.serverTimestamp(),
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
