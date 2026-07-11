import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { checkAdminStatus, getAdminDb } = await import('../../../../src/lib/firebase-admin');
    const adminStatus = checkAdminStatus();
    
    console.log("Health Check: Attempting to initialize Admin DB...");
    const db = getAdminDb();
    console.log("Health Check: Admin DB initialized successfully");

    return NextResponse.json({ 
      status: 'online', 
      api: 'create-user',
      adminStatus,
      dbInitialized: true,
      timestamp: new Date().toISOString(),
      env_check: {
        projectId: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? `SET (length: ${process.env.FIREBASE_PRIVATE_KEY.length})` : 'MISSING',
      }
    });
  } catch (e: any) {
    console.error("Health Check Failed:", e);
    return NextResponse.json({ 
      status: 'error', 
      api: 'create-user',
      error: e.message,
      stack: e.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log("-----------------------------------------");
  console.log("TRACE START: /api/admin/create-user");
  console.log("-----------------------------------------");

  let body: any;
  let adminAuth: any;
  let adminDb: any;
  let userRecord: any;
  let decodedToken: any;

  // STEP 1: Incoming request body
  console.log("STEP 1: Incoming request body");
  try {
    body = await req.json();
    console.log("Payload:", JSON.stringify(body, null, 2));
  } catch (error: any) {
    console.error("STEP 1 FAILED: Body parsing error", error.message);
    return NextResponse.json({ error: "Invalid JSON body", details: error.message }, { status: 400 });
  }

  // STEP 2: Validation result
  console.log("STEP 2: Validation result");
  const { email, password, name, role, business_id } = body;
  try {
    if (!email || !password || !role || !business_id) {
      throw new Error("Missing required fields: email, password, role, or business_id");
    }
    console.log("Validation PASS");
  } catch (error: any) {
    console.error("STEP 2 FAILED: Validation error", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // STEP 3: Firebase Admin initialization
  console.log("[ADMIN INIT] Starting initialization...");
  try {
    console.log("Importing firebase-admin helper...");
    // DEBUG: Check environment variables
    const envCheck = {
      PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
      CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
      PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING'
    };
    console.log("[ADMIN INIT] Env Var Check:", JSON.stringify(envCheck));

    // Using dynamic import to avoid top-level failures and respect ESM/CJS boundaries
    const { getAdminAuth, getAdminDb } = await import('../../../../src/lib/firebase-admin');
    
    console.log("Initializing Auth and Firestore...");
    adminAuth = getAdminAuth();
    adminDb = getAdminDb();
    console.log("[ADMIN INIT] SUCCESS: Firebase Admin SDK ready");
  } catch (error: any) {
    console.error("[ADMIN INIT] FAILED: Firebase Admin initialization error");
    console.error(error.stack);
    return NextResponse.json({ error: "Internal Server Error during Admin Init", details: error.message }, { status: 500 });
  }

  // STEP 4: Auth token check
  console.log("[AUTH VERIFY] Verifying requester permissions...");
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error("Missing or invalid Authorization header");
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    console.log("Calling verifyIdToken...");
    decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("[AUTH VERIFY] SUCCESS: Token verified for UID:", decodedToken.uid);
    
    console.log("Checking owner document in Firestore...");
    const requesterDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!requesterDoc.exists) {
      console.warn("Requester document does not exist in users collection");
      throw new Error("Unauthorized: Requester profile not found");
    }
    const requesterData = requesterDoc.data();
    console.log("Requester role:", requesterData?.role);
    if (requesterData?.role !== 'owner') {
      throw new Error("Unauthorized: Only owners can create users via this API");
    }
    console.log("[AUTH VERIFY] SUCCESS: Requester verified as OWNER");
  } catch (error: any) {
    console.error("[AUTH VERIFY] FAILED: Permission check failed", error.message);
    return NextResponse.json({ error: "Unauthorized", details: error.message }, { status: 401 });
  }

  // STEP 5: admin.auth().createUser()
  console.log("[AUTH CREATE] Creating Auth user...");
  try {
    userRecord = await adminAuth.createUser({
      email,
      password: String(password),
      displayName: name,
    });
    console.log("[AUTH CREATE] SUCCESS: Auth user created. UID:", userRecord.uid);
  } catch (error: any) {
    console.error("[AUTH CREATE] FAILED: admin.auth().createUser() error");
    console.error(error.stack);
    return NextResponse.json({ 
      error: error.code === 'auth/email-already-exists' ? 'Email already in use' : "Auth user creation failed", 
      details: error.message,
      code: error.code 
    }, { status: error.code === 'auth/email-already-exists' ? 409 : 500 });
  }

  // STEP 6: Firestore write
  console.log("[FIRESTORE WRITE] Preparing Firestore records...");
  try {
    const batch = adminDb.batch();
    const ownerId = decodedToken.uid;
    
    // 1. users collection doc
    console.log(`Adding users doc to batch (UID: ${userRecord.uid})...`);
    const userRef = adminDb.collection('users').doc(userRecord.uid);
    const userData = {
      email,
      name,
      role,
      businessId: business_id,
      ownerId: ownerId,
      createdBy: ownerId,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(userRef, userData);

    // 2. staff sub-collection doc
    console.log(`Adding staff doc to batch (Path: businesses/${business_id}/staff/${userRecord.uid})...`);
    const staffRef = adminDb.collection('businesses').doc(business_id).collection('staff').doc(userRecord.uid);
    const staffData = {
      name,
      role,
      active: true,
      businessId: business_id,
      ownerId: ownerId,
      createdBy: ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(staffRef, staffData);

    console.log("Committing Firestore batch...");
    await batch.commit();
    console.log("[FIRESTORE WRITE] SUCCESS: Database records committed");
  } catch (error: any) {
    console.error("[FIRESTORE WRITE] FAILED: Firestore write error");
    console.error("Error Message:", error.message);
    
    console.log("[ROLLBACK] Deleting Auth user...");
    try {
      await adminAuth.deleteUser(userRecord.uid);
      console.log("[ROLLBACK] SUCCESS");
    } catch (rbError: any) {
      console.error("[ROLLBACK] FAILED", rbError.message);
    }
    
    return NextResponse.json({ error: "Database write failed", details: error.message, code: error.code }, { status: 500 });
  }

  // STEP 7: Custom Claims
  console.log("[STAFF CREATED] Finalizing with custom claims...");
  try {
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: role,
      businessId: business_id
    });
    console.log("[STAFF CREATED] Custom claims set successfully");
  } catch (error: any) {
    console.error("[STAFF CREATED] WARNING: Setting custom claims error", error.message);
  }

  // STEP 8: Final Response
  console.log("[API RESPONSE] User creation process completed SUCCESSFULLY");
  return NextResponse.json({
    success: true,
    userId: userRecord.uid,
    message: "User created and initialized successfully"
  }, { status: 200 });
}
