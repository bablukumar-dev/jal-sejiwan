import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/src/lib/firebase-admin';
import { countAndCheckLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  console.log('API create-user called');
  try {
    let adminAuth, adminDb;
    try {
      adminAuth = getAdminAuth();
      adminDb = getAdminDb();
      console.log('Firebase admin initialized');
    } catch (e) {
      console.error('Firebase admin initialization failed', e);
      return NextResponse.json({ error: 'Failed to initialize Firebase Admin' }, { status: 500 });
    }
    
    // Get IP address for rate limit tracking
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    
    // Rate limit: 20 user creations per 15 minutes per IP
    const limitStatus = countAndCheckLimit(`api_admin_create_user_${ip}`, 20, 15 * 60 * 1000);
    if (limitStatus.limited) {
      console.log('Rate limited');
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Unauthorized: Missing Authorization header');
      return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log('Token verified for:', decodedToken.uid);
    
    // Verify requester is an OWNER
    const ownerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!ownerDoc.exists || ownerDoc.data()?.role !== 'owner') {
      console.log('Forbidden: Not an owner');
      return NextResponse.json({ error: 'Forbidden: Only owners can create users' }, { status: 403 });
    }

    const body = await req.json();
    console.log('Request body:', body);
    const { email, password, name, role, business_id } = body;

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
    console.log('Calling adminAuth.createUser');
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });
    } catch (err: any) {
      console.error('Auth createUser error:', err);
      if (err.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
      }
      throw err;
    }
    console.log('User created:', userRecord.uid);

    // 2. Create the user document in Firestore
    console.log('Calling adminDb.collection.set');
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role,
      businessId: business_id,
      createdBy: decodedToken.uid,
      active: true,
      createdAt: new Date().toISOString(),
    });
    console.log('User doc set');

    return NextResponse.json({ 
      message: 'User created successfully', 
      userId: userRecord.uid 
    });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
