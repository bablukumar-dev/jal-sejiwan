import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/src/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Verify requester is an OWNER
    const ownerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!ownerDoc.exists || ownerDoc.data()?.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: Only owners can update user credentials' }, { status: 403 });
    }

    const { userId, password } = await req.json();
    if (!userId || !password) {
      return NextResponse.json({ error: 'Missing userId or password' }, { status: 400 });
    }

    // Update user's password in Firebase Auth
    await adminAuth.updateUser(userId, {
      password: password
    });

    return NextResponse.json({ message: 'User password updated successfully' });
  } catch (err: any) {
    console.error('API Error during password update:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
