import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/src/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Verify requester is an OWNER
    const ownerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!ownerDoc.exists || ownerDoc.data()?.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: Only owners can create users' }, { status: 403 });
    }

    const { email, password, name, role, business_id } = await req.json();

    if (!email || !password || !role || !business_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create the user in Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Create the user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role,
      businessId: business_id,
      createdBy: decodedToken.uid,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      message: 'User created successfully', 
      userId: userRecord.uid 
    });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
