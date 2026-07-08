import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/src/lib/firebase-admin';
import { countAndCheckLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Get IP address for rate limit tracking
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    
    // Rate limit: 20 user creations per 15 minutes per IP
    const limitStatus = countAndCheckLimit(`api_admin_create_user_${ip}`, 20, 15 * 60 * 1000);
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
      return NextResponse.json({ error: 'Forbidden: Only owners can create users' }, { status: 403 });
    }

    const { email, password, name, role, business_id } = await req.json();

    if (!email || !password || !role || !business_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const allowedRoles = ['owner', 'manager', 'staff'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    if (name && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Invalid display name' }, { status: 400 });
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
      active: true,
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
