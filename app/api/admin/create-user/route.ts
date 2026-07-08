import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/src/lib/firebase-admin';
import { countAndCheckLimit } from '@/lib/rateLimit';

export async function GET() {
  return NextResponse.json({ 
    message: "Create User API is active. Use POST to create users.",
    environment: {
      projectId: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? `SET (length: ${process.env.FIREBASE_PRIVATE_KEY.length})` : 'MISSING',
    }
  });
}

export async function POST(req: NextRequest) {
  const trace: string[] = [];
  const logStep = (step: number, desc: string, status: 'PASS' | 'FAIL', detail?: string) => {
    const msg = `STEP ${step}: ${desc} - ${status}${detail ? ` (${detail})` : ''}`;
    trace.push(msg);
    console.log(`[CreateUserAPI] ${msg}`);
  };

  try {
    logStep(1, 'Route execution started', 'PASS');

    let adminAuth, adminDb;
    try {
      logStep(2, 'Initializing Firebase Admin Auth', 'PASS');
      adminAuth = getAdminAuth();
      logStep(3, 'Firebase Admin Auth obtained', 'PASS');
    } catch (e: any) {
      logStep(2, 'Initializing Firebase Admin Auth', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Auth Init Failed', trace }, { status: 500 });
    }

    try {
      logStep(4, 'Initializing Firebase Admin Firestore', 'PASS');
      adminDb = getAdminDb();
      logStep(5, 'Firebase Admin Firestore obtained', 'PASS');
    } catch (e: any) {
      logStep(4, 'Initializing Firebase Admin Firestore', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Firestore Init Failed', trace }, { status: 500 });
    }

    // Check if services are actually objects
    if (!adminAuth || typeof adminAuth.createUser !== 'function') {
      logStep(6, 'Admin Auth validity check', 'FAIL', 'adminAuth is invalid');
    } else {
      logStep(6, 'Admin Auth validity check', 'PASS');
    }

    if (!adminDb || typeof adminDb.collection !== 'function') {
      logStep(7, 'Admin Db validity check', 'FAIL', 'adminDb is invalid');
    } else {
      logStep(7, 'Admin Db validity check', 'PASS');
    }
    
    // Get IP address for rate limit tracking
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    logStep(8, 'IP Address identified', 'PASS', ip);
    
    // Rate limit: 20 user creations per 15 minutes per IP
    try {
      const limitStatus = countAndCheckLimit(`api_admin_create_user_${ip}`, 20, 15 * 60 * 1000);
      if (limitStatus.limited) {
        logStep(9, 'Rate limit check', 'FAIL', 'Limited');
        return NextResponse.json({ success: false, error: 'Too many requests', trace }, { status: 429 });
      }
      logStep(9, 'Rate limit check', 'PASS');
    } catch (e: any) {
      logStep(9, 'Rate limit check', 'FAIL', e.message);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logStep(10, 'Auth header check', 'FAIL', 'Missing or invalid');
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing header', trace }, { status: 401 });
    }
    logStep(10, 'Auth header check', 'PASS');

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      logStep(11, 'Token verification', 'PASS', decodedToken.uid);
    } catch (e: any) {
      logStep(11, 'Token verification', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token', trace }, { status: 401 });
    }
    
    // Verify requester is an OWNER
    try {
      const ownerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      if (!ownerDoc.exists || ownerDoc.data()?.role !== 'owner') {
        logStep(12, 'Owner verification', 'FAIL', 'Not an owner');
        return NextResponse.json({ success: false, error: 'Forbidden: Only owners can create users', trace }, { status: 403 });
      }
      logStep(12, 'Owner verification', 'PASS');
    } catch (e: any) {
      logStep(12, 'Owner verification', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Database error during owner check', trace }, { status: 500 });
    }

    let body;
    try {
      body = await req.json();
      logStep(13, 'Request body parsing', 'PASS');
    } catch (e: any) {
      logStep(13, 'Request body parsing', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Invalid JSON body', trace }, { status: 400 });
    }
    
    const { email, password, name, role, business_id } = body;

    if (!email || !password || !role || !business_id) {
      logStep(14, 'Input validation', 'FAIL', 'Missing fields');
      return NextResponse.json({ success: false, error: 'Missing required fields', trace }, { status: 400 });
    }
    logStep(14, 'Input validation', 'PASS');

    // 1. Create the user in Auth
    let userRecord;
    try {
      logStep(15, 'Creating Auth user', 'PASS', email);
      userRecord = await adminAuth.createUser({
        email,
        password: password.toString(),
        displayName: name,
      });
      logStep(16, 'Auth user created', 'PASS', userRecord.uid);
    } catch (err: any) {
      logStep(15, 'Creating Auth user', 'FAIL', err.message);
      if (err.code === 'auth/email-already-exists') {
        return NextResponse.json({ success: false, error: 'This email is already registered.', trace }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: 'Auth account creation failed', details: err.message, trace }, { status: 500 });
    }

    // 2. Create the user document in Firestore
    try {
      logStep(17, 'Creating Firestore document', 'PASS', userRecord.uid);
      await adminDb.collection('users').doc(userRecord.uid).set({
        email,
        name,
        role,
        businessId: business_id,
        createdBy: decodedToken.uid,
        active: true,
        createdAt: new Date().toISOString(),
      });
      logStep(18, 'Firestore document created', 'PASS');
    } catch (err: any) {
      logStep(17, 'Creating Firestore document', 'FAIL', err.message);
      try {
        await adminAuth.deleteUser(userRecord.uid);
        logStep(19, 'Rollback Auth user', 'PASS');
      } catch (rollbackErr: any) {
        logStep(19, 'Rollback Auth user', 'FAIL', rollbackErr.message);
      }
      return NextResponse.json({ success: false, error: 'Database record creation failed', details: err.message, trace }, { status: 500 });
    }

    logStep(20, 'Success response generation', 'PASS');
    return NextResponse.json({ 
      success: true,
      message: 'User created successfully', 
      userId: userRecord.uid,
      trace
    });

  } catch (err: any) {
    console.error('[CreateUserAPI] CRITICAL FAILURE:', err);
    return NextResponse.json({ 
      success: false,
      error: 'A catastrophic server error occurred',
      details: err.message,
      trace
    }, { status: 500 });
  }
}
