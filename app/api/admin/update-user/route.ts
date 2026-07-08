import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/src/lib/firebase-admin';
import { countAndCheckLimit } from '@/lib/rateLimit';

export async function GET() {
  return NextResponse.json({ 
    message: "Update User API is active. Use POST to update credentials.",
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
    console.log(`[UpdateUserAPI] ${msg}`);
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
    
    // Get IP address for rate limit tracking
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    logStep(6, 'IP Address identified', 'PASS', ip);
    
    // Rate limit
    try {
      const limitStatus = countAndCheckLimit(`api_admin_update_user_${ip}`, 20, 15 * 60 * 1000);
      if (limitStatus.limited) {
        logStep(7, 'Rate limit check', 'FAIL', 'Limited');
        return NextResponse.json({ success: false, error: 'Too many requests', trace }, { status: 429 });
      }
      logStep(7, 'Rate limit check', 'PASS');
    } catch (e: any) {
      logStep(7, 'Rate limit check', 'FAIL', e.message);
    }
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logStep(8, 'Auth header check', 'FAIL', 'Missing or invalid');
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing header', trace }, { status: 401 });
    }
    logStep(8, 'Auth header check', 'PASS');

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      logStep(9, 'Token verification', 'PASS', decodedToken.uid);
    } catch (e: any) {
      logStep(9, 'Token verification', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token', trace }, { status: 401 });
    }
    
    // Verify requester is an OWNER
    try {
      const ownerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      if (!ownerDoc.exists || ownerDoc.data()?.role !== 'owner') {
        logStep(10, 'Owner verification', 'FAIL', 'Not an owner');
        return NextResponse.json({ success: false, error: 'Forbidden: Only owners can update user credentials', trace }, { status: 403 });
      }
      logStep(10, 'Owner verification', 'PASS');
    } catch (e: any) {
      logStep(10, 'Owner verification', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Database error during owner check', trace }, { status: 500 });
    }

    let body;
    try {
      body = await req.json();
      logStep(11, 'Request body parsing', 'PASS');
    } catch (e: any) {
      logStep(11, 'Request body parsing', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Invalid JSON body', trace }, { status: 400 });
    }
    
    const { userId, password } = body;
    if (!userId || !password) {
      logStep(12, 'Input validation', 'FAIL', 'Missing userId or password');
      return NextResponse.json({ success: false, error: 'Missing userId or password', trace }, { status: 400 });
    }
    logStep(12, 'Input validation', 'PASS');

    // Update user's password in Firebase Auth
    try {
      logStep(13, 'Updating password', 'PASS', userId);
      await adminAuth.updateUser(userId, {
        password: password.toString()
      });
      logStep(14, 'Password updated', 'PASS');
    } catch (err: any) {
      logStep(13, 'Updating password', 'FAIL', err.message);
      return NextResponse.json({ success: false, error: 'Failed to update user credentials', details: err.message, trace }, { status: 500 });
    }

    logStep(15, 'Success response generation', 'PASS');
    return NextResponse.json({ success: true, message: 'User password updated successfully', trace });
  } catch (err: any) {
    console.error('[UpdateUserAPI] CRITICAL FAILURE:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'A catastrophic server error occurred',
      details: err.message,
      trace 
    }, { status: 500 });
  }
}
