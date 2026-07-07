import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/src/lib/firebase-admin';
import { countAndCheckLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Get IP address for rate limit tracking
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    
    // Rate limit: 20 updates per 15 minutes per IP
    const limitStatus = countAndCheckLimit(`api_admin_update_user_${ip}`, 20, 15 * 60 * 1000);
    if (limitStatus.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

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

    // Input validation
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
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
