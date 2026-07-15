import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '../../../../src/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Verify requesting user is an owner or manager
    const requesterDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!requesterDoc.exists) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found' }, { status: 401 });
    }

    const requesterData = requesterDoc.data();
    if (requesterData?.role !== 'owner' && requesterData?.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const uid = req.nextUrl.searchParams.get('uid');
    if (!uid) return NextResponse.json({ error: 'no uid' }, { status: 400 });
    
    const doc = await adminDb.collection('users').doc(uid).get();
    
    // Ensure data isolation: cannot view user of another business
    const userData = doc.data();
    if (doc.exists && userData?.businessId !== requesterData.businessId) {
      return NextResponse.json({ error: 'Forbidden: Business isolation violation' }, { status: 403 });
    }

    return NextResponse.json({
      exists: doc.exists,
      data: userData,
      path: doc.ref.path
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
  }
}

