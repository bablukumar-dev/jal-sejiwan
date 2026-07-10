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

  try {
    logStep(1, 'Route execution started', 'PASS');

    // 1. Dynamic import of Firebase Admin to catch load-time errors
    let getAdminAuth, getAdminDb;
    try {
      const fbAdmin = await import('../../../../src/lib/firebase-admin');
      getAdminAuth = fbAdmin.getAdminAuth;
      getAdminDb = fbAdmin.getAdminDb;
      logStep(2, 'Firebase Admin Module loaded', 'PASS');
    } catch (e: any) {
      logStep(2, 'Firebase Admin Module loaded', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Module Load Failed', details: e.message, trace }, { status: 500 });
    }

    let adminAuth, adminDb;
    try {
      adminAuth = getAdminAuth();
      logStep(3, 'Firebase Admin Auth initialized', 'PASS');
    } catch (e: any) {
      logStep(3, 'Firebase Admin Auth initialized', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Auth Init Failed', details: e.message, trace }, { status: 500 });
    }

    try {
      adminDb = getAdminDb();
      logStep(4, 'Firebase Admin Firestore initialized', 'PASS');
    } catch (e: any) {
      logStep(4, 'Firebase Admin Firestore initialized', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Firestore Init Failed', details: e.message, trace }, { status: 500 });
    }

    // 2. Identify IP and check rate limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    logStep(5, 'IP Address identified', 'PASS', ip);
    
    try {
      const limitStatus = countAndCheckLimit(`api_admin_create_user_${ip}`, 50, 15 * 60 * 1000); // Increased limit for debugging
      if (limitStatus.limited) {
        logStep(6, 'Rate limit check', 'FAIL', 'Limited');
        return NextResponse.json({ success: false, error: 'Rate limit exceeded', trace }, { status: 429 });
      }
      logStep(6, 'Rate limit check', 'PASS');
    } catch (e: any) {
      logStep(6, 'Rate limit check', 'FAIL', e.message);
    }

    // 3. Auth Header Verification
    const authHeader = req.headers.get('Authorization');
    console.log("DEBUG: AUTH HEADER:", authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logStep(7, 'Auth header check', 'FAIL', 'Missing or invalid');
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing token', trace }, { status: 401 });
    }
    logStep(7, 'Auth header check', 'PASS');

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      logStep(8, 'Token verification', 'PASS', `UID: ${decodedToken.uid}`);
    } catch (e: any) {
      logStep(8, 'Token verification', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token', trace }, { status: 401 });
    }
    
    // 4. Owner Verification
    try {
      const ownerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      if (!ownerDoc.exists) {
        logStep(9, 'Owner existence check', 'FAIL', `UID ${decodedToken.uid} not found in DB`);
        return NextResponse.json({ success: false, error: 'Forbidden: User not found in database', trace }, { status: 403 });
      }
      if (ownerDoc.data()?.role !== 'owner') {
        logStep(9, 'Owner role verification', 'FAIL', `Role is ${ownerDoc.data()?.role}`);
        return NextResponse.json({ success: false, error: 'Forbidden: Only owners can create users', trace }, { status: 403 });
      }
      logStep(9, 'Owner verification', 'PASS');
    } catch (e: any) {
      logStep(9, 'Owner verification', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Database error during permission check', details: e.message, trace }, { status: 500 });
    }

    // 5. Request Body Parsing
    let body;
    try {
      body = await req.json();
      logStep(10, 'Request body parsing', 'PASS');
    } catch (e: any) {
      logStep(10, 'Request body parsing', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Invalid JSON body', trace }, { status: 400 });
    }
    
    const { email, password, name, role, business_id } = body;
    console.log("-----------------------------------------");
    console.log("DEBUG: RECEIVED REQUEST BODY");
    console.log("EMAIL:", email);
    console.log("PASSWORD:", password ? "******" : "MISSING");
    console.log("ROLE:", role);
    console.log("BUSINESS ID:", business_id);
    console.log("DISPLAY NAME:", name);
    console.log("-----------------------------------------");
    logStep(11, 'Body content check', 'PASS', `Email: ${email}, Role: ${role}, Business: ${business_id}`);

    // Verify Firebase Admin SDK initialization
    const firebaseAdmin = await import('../../../../src/lib/firebase-admin');
    console.log("firebaseAdmin.apps.length:", firebaseAdmin.getAdminAuth().app.name);
    console.log("Firebase Admin initialized successfully");

    // Verify environment variables
    console.log("FIREBASE_PROJECT_ID Exists:", !!process.env.FIREBASE_PROJECT_ID);
    console.log("FIREBASE_CLIENT_EMAIL Exists:", !!process.env.FIREBASE_CLIENT_EMAIL);
    console.log("FIREBASE_PRIVATE_KEY Exists:", !!process.env.FIREBASE_PRIVATE_KEY);

    if (!email || !password || !role || !business_id) {
      logStep(12, 'Input validation', 'FAIL', 'Missing required fields');
      return NextResponse.json({ success: false, error: 'Missing required fields', trace }, { status: 400 });
    }

    // 6. Business Existence Check
    try {
      const businessDoc = await adminDb.collection('businesses').doc(business_id).get();
      if (!businessDoc.exists) {
        logStep(13, 'Business existence check', 'FAIL', `Business ID ${business_id} not found`);
        return NextResponse.json({ success: false, error: 'Business not found', trace }, { status: 400 });
      }
      logStep(13, 'Business existence check', 'PASS');
    } catch (e: any) {
      logStep(13, 'Business existence check', 'FAIL', e.message);
      // We'll proceed if it's just a read error, but log it
    }

    // 7. Auth User Creation
    let userRecord;
    try {
      logStep(14, 'Creating Auth user', 'PASS', email);
      userRecord = await adminAuth.createUser({
        email,
        password: String(password),
        displayName: name,
      });
      logStep(15, 'Auth user created', 'PASS', userRecord.uid);
    } catch (err: any) {
      logStep(14, 'Creating Auth user', 'FAIL', err.message);
      if (err.code === 'auth/email-already-exists') {
        return NextResponse.json({ success: false, error: 'Email already exists', trace }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: 'Auth account creation failed', details: err.message, trace }, { status: 500 });
    }

    // 8. Firestore User and Staff Creation
    try {
      // Get ownerId (which is the uid of the owner of this business)
      const businessDoc = await adminDb.collection('businesses').doc(business_id).get();
      const bData = businessDoc.data();
      const ownerId = bData?.ownerId || decodedToken.uid;

      logStep(16, 'Creating Firestore user document', 'PASS', userRecord.uid);
      await adminDb.collection('users').doc(userRecord.uid).set({
        email,
        name,
        role,
        businessId: business_id,
        ownerId: ownerId,
        createdBy: decodedToken.uid,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      logStep(17, 'Firestore user document created', 'PASS');

      logStep(18, 'Creating Firestore staff subcollection document', 'PASS');
      await adminDb.collection('businesses').doc(business_id).collection('staff').doc(userRecord.uid).set({
        name,
        phone: '', // Placeholder phone
        role,
        route: '', // Placeholder route
        pin: '1234', // Default pin
        active: true,
        businessId: business_id,
        ownerId: ownerId,
        createdBy: decodedToken.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      logStep(19, 'Firestore staff subcollection document created', 'PASS');
    } catch (err: any) {
      logStep(16, 'Creating Firestore document', 'FAIL', err.message);
      // Rollback Auth user
      try {
        await adminAuth.deleteUser(userRecord.uid);
        logStep(20, 'Rollback Auth user', 'PASS');
      } catch (rollbackErr: any) {
        logStep(20, 'Rollback Auth user', 'FAIL', rollbackErr.message);
      }
      return NextResponse.json({ success: false, error: 'Database record creation failed', details: err.message, trace }, { status: 500 });
    }

    logStep(21, 'Process completed successfully', 'PASS');
    return NextResponse.json({ 
      success: true,
      message: 'User created successfully', 
      userId: userRecord.uid,
      trace
    });

  } catch (err: any) {
    console.log("CATASTROPHIC FAILURE REACHED");
    console.error(err.stack);
    console.error('[CreateUserAPI] UNCAUGHT CATASTROPHIC ERROR:', err);
    return NextResponse.json({ 
      success: false,
      error: 'Catastrophic server error',
      details: err.message,
      stack: err.stack,
      trace: trace.length > 0 ? trace : ['Crash before trace initialization']
    }, { status: 500 });
  }
}
