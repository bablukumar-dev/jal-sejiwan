import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '../../../src/lib/firebase-admin';

export async function POST(req: NextRequest) {
  console.log("-----------------------------------------");
  console.log("[SERVER START] /api/deliver-water");
  console.log("-----------------------------------------");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // REQUEST RECEIVED
    console.log("[REQUEST RECEIVED]");

    let body: any;
    try {
      body = await req.json();
      console.log("[BODY PARSED] Payload:", JSON.stringify(body));
    } catch (error: any) {
      console.error("[BODY PARSED] FAILED:", error.message);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { deliveries, businessId } = body;
    if (!deliveries || !Array.isArray(deliveries) || !businessId) {
      console.error("[VALIDATION] FAILED: Missing deliveries or businessId");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // AUTH VERIFIED
    console.log("[AUTH VERIFIED] Checking token...");
    let decodedToken;
    try {
      const adminAuth = getAdminAuth();
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error("Missing Authorization header");
      }
      const idToken = authHeader.split('Bearer ')[1];
      decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log("[AUTH VERIFIED] SUCCESS for UID:", decodedToken.uid);
    } catch (error: any) {
      console.error("[AUTH VERIFIED] FAILED:", error.message);
      return NextResponse.json({ error: "Unauthorized", details: error.message }, { status: 401 });
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

    // ENV LOADED
    console.log("[ENV LOADED] Admin SDK ready");

    // WRITE FIRESTORE
    console.log("[WRITE FIRESTORE] Starting batch write...");
    try {
      const batch = adminDb.batch();
      const timestamp = new Date().toISOString();
      const results: string[] = [];

      for (const d of deliveries) {
        const deliveryRef = adminDb.collection('businesses').doc(businessId).collection('deliveries').doc();
        const auditData = {
          ...d,
          businessId,
          createdBy: decodedToken.uid,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        batch.set(deliveryRef, auditData);
        results.push(deliveryRef.id);
      }

      await batch.commit();
      console.log("[WRITE FIRESTORE] SUCCESS. IDs:", results);

      // RETURN RESPONSE
      console.log("[RETURN RESPONSE] SUCCESS 200");
      return NextResponse.json({
        success: true,
        ids: results,
        message: "Deliveries recorded successfully"
      }, { status: 200 });

    } catch (error: any) {
      console.error("[WRITE FIRESTORE] FAILED:", error.message);
      return NextResponse.json({ error: "Firestore write failed", details: error.message }, { status: 500 });
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("[API TIMEOUT] Operation exceeded 10 seconds");
      return NextResponse.json({ error: "Request timed out on server" }, { status: 504 });
    }
    console.error("[UNEXPECTED ERROR]", error);
    return NextResponse.json({ error: "Unexpected error", details: error.message }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
