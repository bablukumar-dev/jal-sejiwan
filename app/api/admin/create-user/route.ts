import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb, checkAdminStatus } from '../../../../src/lib/firebase-admin';

export async function GET() {
  console.log("[HEALTH CHECK] GET /api/admin/create-user");
  try {
    console.log("[HEALTH CHECK] Verifying environment variables...");
    const envStatus = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? `SET (Length: ${process.env.FIREBASE_PRIVATE_KEY.length})` : 'MISSING',
    };
    
    console.log("[HEALTH CHECK] Attempting Admin DB initialization...");
    const db = getAdminDb();
    const adminStatus = checkAdminStatus();

    return NextResponse.json({ 
      status: 'online', 
      api: 'create-user',
      adminStatus,
      envStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[HEALTH CHECK] FAILED:", e.message);
    return NextResponse.json({ 
      status: 'error', 
      error: e.message,
      stack: e.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log("-----------------------------------------");
  console.log("[SERVER START] /api/admin/create-user");
  console.log("-----------------------------------------");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    let body: any;
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    let userRecord: any;
    let decodedToken: any;

    // STEP 1: Incoming request body
    console.log("STEP 1: Parsing body...");
    try {
      body = await req.json();
      console.log("[BODY PARSED] Payload:", JSON.stringify({ ...body, password: '***' }));
    } catch (error: any) {
      console.error("[BODY PARSED] FAILED:", error.message);
      return NextResponse.json({ error: "Invalid JSON body", details: error.message }, { status: 400 });
    }

    // STEP 2: Validation
    const { email, password, name, role, business_id, route } = body;
    if (!email || !password || !role || !business_id) {
      console.error("[VALIDATION] FAILED: Missing fields");
      return NextResponse.json({ error: "Missing required fields: email, password, role, or business_id" }, { status: 400 });
    }
    console.log("[VALIDATION] PASS");

    // STEP 3: Verify environment variables
    console.log("[ENV LOADED] Checking variables...");
    // Firebase Admin SDK will validate credentials upon initialization in STEP 4
    console.log("[ENV LOADED] Proceeding to initialization...");

    // STEP 4: Firebase Admin initialization

    // STEP 5: Auth verification
    console.log("[AUTH VERIFIED] Checking requester...");
    try {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error("Missing Authorization header");
      }
      const idToken = authHeader.split('Bearer ')[1];
      decodedToken = await adminAuth.verifyIdToken(idToken);
      
      const requesterDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      if (!requesterDoc.exists) throw new Error("Requester profile not found");
      
      const requesterData = requesterDoc.data();
      if (requesterData?.role !== 'owner' && requesterData?.role !== 'manager') {
        throw new Error("Unauthorized: Insufficient permissions");
      }
      console.log("[AUTH VERIFIED] SUCCESS for UID:", decodedToken.uid);
    } catch (error: any) {
      console.error("[AUTH VERIFIED] FAILED:", error.message);
      return NextResponse.json({ error: "Unauthorized", details: error.message }, { status: 401 });
    }

    // STEP 6: Create Auth User
    console.log("[CREATE AUTH USER] Creating...");
    try {
      userRecord = await adminAuth.createUser({
        email,
        password: String(password),
        displayName: name,
      });
      console.log("[CREATE AUTH USER] SUCCESS: UID", userRecord.uid);
    } catch (error: any) {
      console.error("[CREATE AUTH USER] FAILED:", error.message);
      return NextResponse.json({ 
        error: error.code === 'auth/email-already-exists' ? 'Email already in use' : "Auth user creation failed", 
        details: error.message 
      }, { status: error.code === 'auth/email-already-exists' ? 409 : 500 });
    }

    // STEP 7: Write Firestore
    console.log("[WRITE FIRESTORE] Writing records...");
    try {
      const batch = adminDb.batch();
      const ownerId = decodedToken.uid;
      
      const userRef = adminDb.collection('users').doc(userRecord.uid);
      batch.set(userRef, {
        email, name, role, businessId: business_id, createdBy: ownerId, active: true,
        route: route || '',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });

      const staffRef = adminDb.collection('businesses').doc(business_id).collection('staff').doc(userRecord.uid);
      batch.set(staffRef, {
        name, role, active: true, businessId: business_id, createdBy: ownerId,
        route: route || '',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });

      await batch.commit();
      console.log("[WRITE FIRESTORE] SUCCESS");
    } catch (error: any) {
      console.error("[WRITE FIRESTORE] FAILED:", error.message);
      // Cleanup auth user on firestore failure
      await adminAuth.deleteUser(userRecord.uid).catch(() => {});
      return NextResponse.json({ error: "Database write failed", details: error.message }, { status: 500 });
    }

    // STEP 8: Custom Claims
    try {
      await adminAuth.setCustomUserClaims(userRecord.uid, { role, businessId: business_id });
      console.log("[STAFF CREATED] Claims set");
    } catch (e: any) {
      console.warn("[STAFF CREATED] Claims warning:", e.message);
    }

    // RETURN RESPONSE
    console.log("[RETURN RESPONSE] SUCCESS 200");
    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      message: "User created successfully"
    }, { status: 200 });

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("[API TIMEOUT] Operation exceeded 15 seconds");
      return NextResponse.json({ error: "Request timed out on server" }, { status: 504 });
    }
    console.error("[UNEXPECTED ERROR]", error);
    return NextResponse.json({ error: "Unexpected error", details: error.message }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
