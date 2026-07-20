import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '../../../../src/lib/firebase-admin';
import { countAndCheckLimit } from '../../../../lib/rateLimit';

export async function GET() {
  return NextResponse.json({ status: 'online', api: 'update-user' });
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
      adminAuth = getAdminAuth();
      logStep(2, 'Firebase Admin Auth obtained', 'PASS');
    } catch (e: any) {
      logStep(2, 'Initializing Firebase Admin Auth', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Auth Init Failed', trace }, { status: 500 });
    }

    try {
      adminDb = getAdminDb();
      logStep(3, 'Firebase Admin Firestore obtained', 'PASS');
    } catch (e: any) {
      logStep(3, 'Initializing Firebase Admin Firestore', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Firestore Init Failed', trace }, { status: 500 });
    }
    
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    logStep(4, 'IP Address identified', 'PASS', ip);
    
    try {
      const limitStatus = countAndCheckLimit(`api_admin_update_user_${ip}`, 20, 15 * 60 * 1000);
      if (limitStatus.limited) {
        logStep(5, 'Rate limit check', 'FAIL', 'Limited');
        return NextResponse.json({ success: false, error: 'Too many requests', trace }, { status: 429 });
      }
      logStep(5, 'Rate limit check', 'PASS');
    } catch (e: any) {
      logStep(5, 'Rate limit check', 'FAIL', e.message);
    }
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logStep(6, 'Auth header check', 'FAIL', 'Missing or invalid');
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing header', trace }, { status: 401 });
    }
    logStep(6, 'Auth header check', 'PASS');

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      logStep(7, 'Token verification', 'PASS', decodedToken.uid);
    } catch (e: any) {
      logStep(7, 'Token verification', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token', trace }, { status: 401 });
    }
    
    try {
      const ownerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      if (!ownerDoc.exists || ownerDoc.data()?.role !== 'owner') {
        logStep(8, 'Owner verification', 'FAIL', 'Not an owner');
        return NextResponse.json({ success: false, error: 'Forbidden: Only owners can update user credentials', trace }, { status: 403 });
      }
      logStep(8, 'Owner verification', 'PASS');
    } catch (e: any) {
      logStep(8, 'Owner verification', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Database error during owner check', trace }, { status: 500 });
    }

    let body;
    try {
      body = await req.json();
      logStep(9, 'Request body parsing', 'PASS');
    } catch (e: any) {
      logStep(9, 'Request body parsing', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Invalid JSON body', trace }, { status: 400 });
    }
    
    const { userId, password } = body;
    if (!userId || !password) {
      logStep(10, 'Input validation', 'FAIL', 'Missing userId or password');
      return NextResponse.json({ success: false, error: 'Missing userId or password', trace }, { status: 400 });
    }

    // Strict Tenant Isolation Verification
    try {
      const targetDoc = await adminDb.collection('users').doc(userId).get();
      if (!targetDoc.exists) {
        logStep(10, 'Tenant isolation check', 'FAIL', 'Target user not found');
        return NextResponse.json({ success: false, error: 'Target user not found', trace }, { status: 404 });
      }
      
      const ownerUser = ownerDoc.data();
      const targetUser = targetDoc.data();
      if (targetUser?.businessId !== ownerUser?.businessId) {
        logStep(10, 'Tenant isolation check', 'FAIL', 'Cross-tenant update blocked');
        return NextResponse.json({ success: false, error: 'Forbidden: Cross-tenant update blocked', trace }, { status: 403 });
      }
      logStep(10, 'Tenant isolation check', 'PASS');
    } catch (e: any) {
      logStep(10, 'Tenant isolation check', 'FAIL', e.message);
      return NextResponse.json({ success: false, error: 'Database error during isolation check', trace }, { status: 500 });
    }

    try {
      logStep(11, 'Updating password', 'PASS', userId);
      await adminAuth.updateUser(userId, {
        password: String(password)
      });
      logStep(12, 'Password updated', 'PASS');
    } catch (err: any) {
      logStep(11, 'Updating password', 'FAIL', err.message);
      return NextResponse.json({ success: false, error: 'Failed to update user credentials', details: err.message, trace }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User password updated successfully', trace });
  } catch (err: any) {
    console.error('[UpdateUserAPI] CATASTROPHIC ERROR:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Catastrophic server error',
      details: err.message,
      trace 
    }, { status: 500 });
  }
}
