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
  console.log("STEP 3: Firebase Admin initialization");
  try {
    console.log("Importing firebase-admin helper...");
    // Using dynamic import to avoid top-level failures
    const { getAdminAuth, getAdminDb } = await import('../../../../src/lib/firebase-admin');
    console.log("Calling getAdminAuth()...");
    adminAuth = getAdminAuth();
    console.log("Calling getAdminDb()...");
    adminDb = getAdminDb();
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error: any) {
    console.error("STEP 3 FAILED: Firebase Admin initialization error");
    console.error(error.stack);
    return NextResponse.json({ error: "Internal Server Error during Admin Init", details: error.message }, { status: 500 });
  }

  // STEP 4: Environment variables
  console.log("STEP 4: Environment variables");
  try {
    const envVars = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "SET" : "MISSING",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "SET" : "MISSING",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? `SET (length: ${process.env.FIREBASE_PRIVATE_KEY.length})` : "MISSING",
    };
    console.log("Env Check:", JSON.stringify(envVars, null, 2));
  } catch (error: any) {
    console.error("STEP 4 FAILED: Environment variables check error", error.message);
  }

  // Verification: Auth token check
  console.log("Verifying requester permissions...");
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error("Missing or invalid Authorization header");
    }
    const idToken = authHeader.split('Bearer ')[1];
    console.log("Calling verifyIdToken...");
    decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("Token verified for UID:", decodedToken.uid);
    
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
    console.log("Requester verified as OWNER");
  } catch (error: any) {
    console.error("Permission check failed", error.message);
    return NextResponse.json({ error: "Unauthorized", details: error.message }, { status: 401 });
  }

  // STEP 5: admin.auth().createUser()
  console.log("STEP 5: admin.auth().createUser()");
  try {
    console.log("Calling adminAuth.createUser...");
    userRecord = await adminAuth.createUser({
      email,
      password: String(password),
      displayName: name,
    });
    console.log("Auth user created successfully. UID:", userRecord.uid);
  } catch (error: any) {
    console.error("STEP 5 FAILED: admin.auth().createUser() error");
    console.error(error.stack);
    return NextResponse.json({ 
      error: error.code === 'auth/email-already-exists' ? 'Email already in use' : "Auth user creation failed", 
      details: error.message,
      code: error.code 
    }, { status: error.code === 'auth/email-already-exists' ? 409 : 500 });
  }

  // STEP 6: Firestore write
  console.log("STEP 6: Firestore write");
  try {
    console.log("Preparing Firestore batch...");
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
    console.log("User Data Payload:", JSON.stringify(userData, null, 2));
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
    console.log("Staff Data Payload:", JSON.stringify(staffData, null, 2));
    batch.set(staffRef, staffData);

    console.log("Committing Firestore batch...");
    await batch.commit();
    console.log("Firestore batch committed successfully");
  } catch (error: any) {
    console.error("STEP 6 FAILED: Firestore write error");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    console.error("Error Details:", JSON.stringify(error, null, 2));
    console.error(error.stack);
    
    console.log("Attempting ROLLBACK: Deleting Auth user...");
    try {
      await adminAuth.deleteUser(userRecord.uid);
      console.log("Rollback SUCCESS");
    } catch (rbError: any) {
      console.error("Rollback FAILED", rbError.message);
    }
    
    return NextResponse.json({ error: "Database write failed", details: error.message, code: error.code, stack: error.stack }, { status: 500 });
  }

  // STEP 7: Custom Claims
  console.log("STEP 7: Custom Claims");
  try {
    console.log("Calling setCustomUserClaims...");
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: role,
      businessId: business_id
    });
    console.log("Custom claims set successfully");
  } catch (error: any) {
    console.error("STEP 7 FAILED: Setting custom claims error", error.message);
  }

  // STEP 8: Final Response
  console.log("STEP 8: Final Response");
  console.log("User creation process completed SUCCESSFULLY");
  console.log("-----------------------------------------");
  return NextResponse.json({
    success: true,
    userId: userRecord.uid,
    message: "User created and initialized successfully"
  }, { status: 200 });
}
