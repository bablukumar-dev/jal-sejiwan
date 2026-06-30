import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin if not already initialized
let adminApp: App;
if (getApps().length === 0) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}

export async function POST(req: NextRequest) {
  try {
    const { uid, businessId } = await req.json();

    if (!uid || !businessId) {
      return NextResponse.json({ error: 'Missing uid or businessId' }, { status: 400 });
    }

    // Set custom claims
    await getAuth(adminApp).setCustomUserClaims(uid, { businessId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
