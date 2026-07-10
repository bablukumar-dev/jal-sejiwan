import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '../../../../src/lib/firebase-admin';
import { countAndCheckLimit } from '../../../../lib/rateLimit';

// Use a simple health check to verify route is reachable
export async function GET() {
  try {
    const { checkAdminStatus } = await import('../../../../src/lib/firebase-admin');
    const adminStatus = checkAdminStatus();
    
    return NextResponse.json({ 
      status: 'online', 
      api: 'create-user',
      adminStatus,
      timestamp: new Date().toISOString(),
      env_check: {
        projectId: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? `SET (length: ${process.env.FIREBASE_PRIVATE_KEY.length})` : 'MISSING',
      }
    });
  } catch (e: any) {
    return NextResponse.json({ 
      status: 'error', 
      api: 'create-user',
      error: e.message,
      timestamp: new Date().toISOString()
    });
  }
}

export async function POST(req: NextRequest) {
  const trace: string[] = [];
  const logStep = (step: number, desc: string, status: 'PASS' | 'FAIL', detail?: string) => {
    const msg = `STEP ${step}: ${desc} - ${status}${detail ? ` (${detail})` : ''}`;
    trace.push(msg);
    console.log(`[CreateUserAPI] ${msg}`);
  };

  console.log("-----------------------------------------");
  console.log("STARTING USER CREATION TRACE");
  console.log("-----------------------------------------");

  let getAdminAuth, getAdminDb;
  let adminAuth: any, adminDb: any;
  let body: any;
  let decodedToken: any;
  let businessId: string = '';
  let ownerDocData: any;
  let userRecord: any;

  // STEP 1: Firebase Admin module loading
  console.log("STEP 1: Firebase Admin module loading");
  try {
    const fbAdmin = await import('../../../../src/lib/firebase-admin');
    getAdminAuth = fbAdmin.getAdminAuth;
    getAdminDb = fbAdmin.getAdminDb;
    logStep(1, 'Firebase Admin Module loaded', 'PASS');
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({
      success: false,
      failedStep: "Firebase Admin Module Loading",
      code: error.code || 'MODULE_LOAD_ERROR',
      message: error.message,
      details: "Could not import firebase-admin modules dynamically",
      stack: error.stack,
      trace
    }, { status: 500 });
  }

  // STEP 2: Firebase Admin Auth initialization
  console.log("STEP 2: Firebase Admin Auth initialization");
  try {
    adminAuth = getAdminAuth();
    logStep(2, 'Firebase Admin Auth initialized', 'PASS');
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({
      success: false,
      failedStep: "Firebase Admin Auth initialization",
      code: error.code || 'AUTH_INIT_ERROR',
      message: error.message,
      details: "Failed to initialize Firebase Admin Authentication",
      stack: error.stack,
      trace
    }, { status: 500 });
  }

  // STEP 3: Firebase Admin Firestore initialization
  console.log("STEP 3: Firebase Admin Firestore initialization");
  try {
    adminDb = getAdminDb();
    logStep(3, 'Firebase Admin Firestore initialized', 'PASS');
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({
      success: false,
      failedStep: "Firebase Admin Firestore initialization",
      code: error.code || 'FIRESTORE_INIT_ERROR',
      message: error.message,
      details: "Failed to initialize Firebase Admin Firestore Database",
      stack: error.stack,
      trace
    }, { status: 500 });
  }

  // STEP 4: Request body parsing
  console.log("STEP 4: Request body parsing");
  try {
    body = await req.json();
    logStep(4, 'Request body parsing', 'PASS');
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({
      success: false,
      failedStep: "Request body parsing",
      code: error.code || 'JSON_PARSE_ERROR',
      message: error.message,
      details: "Failed to parse incoming JSON request body",
      stack: error.stack,
      trace
    }, { status: 400 });
  }

  // STEP 5: Input validation
  console.log("STEP 5: Input validation");
  const { email, password, name, role, business_id } = body;
  try {
    if (!email || !password || !role || !business_id) {
      throw new Error("Missing required fields: email, password, role, or business_id");
    }
    logStep(5, 'Input validation', 'PASS', `Email: ${email}, Role: ${role}, Business: ${business_id}`);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({
      success: false,
      failedStep: "Input validation",
      code: 'MISSING_FIELDS',
      message: error.message,
      details: "The request body is missing one or more required fields.",
      stack: error.stack,
      trace
    }, { status: 400 });
  }

  // STEP 6: Token verification
  console.log("STEP 6: Token verification");
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error("Missing or invalid Authorization header scheme");
    }
    const idToken = authHeader.split('Bearer ')[1];
    decodedToken = await adminAuth.verifyIdToken(idToken);
    logStep(6, 'Token verification', 'PASS', `UID: ${decodedToken.uid}`);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({
      success: false,
      failedStep: "Token verification",
      code: error.code || 'UNAUTHORIZED',
      message: error.message,
      details: "Token verification failed. Please authenticate as a valid Owner.",
      stack: error.stack,
      trace
    }, { status: 401 });
  }

  // STEP 7: Current owner verification
  console.log("STEP 7: Current owner verification");
  try {
    const ownerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!ownerDoc.exists) {
      throw new Error(`Owner UID ${decodedToken.uid} does not exist in Firestore 'users' collection`);
    }
    ownerDocData = ownerDoc.data();
    if (ownerDocData?.role !== 'owner') {
      throw new Error(`Forbidden: User has role '${ownerDocData?.role}', only 'owner' is authorized to create staff`);
    }
    logStep(7, 'Owner verification', 'PASS');
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({
      success: false,
      failedStep: "Owner verification",
      code: 'FORBIDDEN_ROLE',
      message: error.message,
      details: "You do not have the required role or permissions to perform this operation.",
      stack: error.stack,
      trace
    }, { status: 403 });
  }

  // STEP 8: businessId loading and existence verification
  console.log("STEP 8: businessId loading");
  try {
    businessId = business_id;
    const businessDoc = await adminDb.collection('businesses').doc(businessId).get();
    if (!businessDoc.exists) {
      throw new Error(`Business collection doc for ID '${businessId}' does not exist`);
    }
    logStep(8, 'Business existence check', 'PASS');
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({
      success: false,
      failedStep: "Business existence check",
      code: 'BUSINESS_NOT_FOUND',
      message: error.message,
      details: "The specified business ID does not map to an existing business document.",
      stack: error.stack,
      trace
    }, { status: 400 });
  }

  // STEP 9: createUser() in Firebase Auth
  console.log("STEP 9: createUser() in Firebase Auth");
  console.log("-----------------------------------------");
  console.log("CREATING AUTH USER INFO:");
  console.log("Email:", email);
  console.log("Password length:", password ? String(password).length : 0);
  console.log("DisplayName:", name);
  console.log("-----------------------------------------");

  try {
    logStep(9, 'Creating Auth user', 'PASS', email);
    userRecord = await adminAuth.createUser({
      email,
      password: String(password),
      displayName: name,
    });
    logStep(9, 'Auth user created successfully', 'PASS', userRecord.uid);
  } catch (error: any) {
    console.error("createUser failed! Printing details:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    return NextResponse.json({
      success: false,
      failedStep: "Auth user creation",
      code: error.code || 'AUTH_CREATION_FAILED',
      message: error.message,
      details: error.code === 'auth/email-already-exists' 
        ? 'This email is already registered.' 
        : 'Failed to create user account on Firebase Auth module.',
      stack: error.stack,
      trace
    }, { status: error.code === 'auth/email-already-exists' ? 409 : 500 });
  }

  // STEP 10: Firestore writes with rollback capability
  console.log("STEP 10: Firestore writes with rollback capability");
  const ownerId = decodedToken.uid;
  console.log("-----------------------------------------");
  console.log("FIRESTORE WRITE CONFIGURATION:");
  console.log("Owner UID:", ownerId);
  console.log("Business ID:", businessId);
  console.log("Staff Role:", role);
  console.log("Staff UID:", userRecord.uid);
  console.log("-----------------------------------------");

  try {
    // 1. Write users/{uid}
    logStep(10, 'Writing users/{uid} document', 'PASS', userRecord.uid);
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role,
      businessId: businessId,
      ownerId: ownerId,
      createdBy: ownerId,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log("Firestore users/{uid} document written successfully!");

    // 2. Write businesses/{businessId}/staff/{uid}
    logStep(11, 'Writing businesses/{businessId}/staff/{uid} document', 'PASS');
    await adminDb.collection('businesses').doc(businessId).collection('staff').doc(userRecord.uid).set({
      name,
      phone: '', // Placeholder phone
      role,
      route: '', // Placeholder route
      pin: '1234', // Default pin
      active: true,
      businessId: businessId,
      ownerId: ownerId,
      createdBy: ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log("Firestore businesses/{businessId}/staff/{uid} written successfully!");

    // 3. Write businesses/{businessId}/activityLogs to log creation event
    logStep(12, 'Writing business activity log', 'PASS');
    await adminDb.collection('businesses').doc(businessId).collection('activityLogs').add({
      module: 'Staff Management',
      action: 'Staff Created',
      description: `Staff member ${name} (${email}) was created by Owner.`,
      status: 'success',
      userId: ownerId,
      businessId: businessId,
      createdAt: new Date().toISOString()
    });
    console.log("Activity log recorded successfully!");

    logStep(13, 'Process completed successfully', 'PASS');
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId: userRecord.uid,
      trace
    });

  } catch (error: any) {
    console.error("Firestore write failed! Initiating rollback delete of created Auth user:", userRecord.uid);
    console.error(error);

    try {
      await adminAuth.deleteUser(userRecord.uid);
      logStep(14, 'Rollback Auth user deletion', 'PASS', userRecord.uid);
      console.log("Rollback completed successfully. Auth user deleted.");
    } catch (rollbackError: any) {
      logStep(14, 'Rollback Auth user deletion', 'FAIL', rollbackError.message);
      console.error("Rollback failed! Orphan Auth user may exist. Details:", rollbackError);
    }

    return NextResponse.json({
      success: false,
      failedStep: "Firestore writes",
      code: error.code || 'FIRESTORE_WRITE_FAILED',
      message: error.message,
      details: "User creation was rolled back because database record creation failed.",
      stack: error.stack,
      trace
    }, { status: 500 });
  }
}
