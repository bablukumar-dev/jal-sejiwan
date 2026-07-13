import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '../../../../src/lib/firebase-admin';

export async function GET() {
  return NextResponse.json({ status: 'online', api: 'inventory-update' });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (e: any) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token', details: e.message }, { status: 401 });
    }

    // Fetch the caller's registered user document to get their businessId
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'Forbidden: User not found in database' }, { status: 403 });
    }

    const userData = userDoc.data();
    const businessId = userData?.businessId;
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Forbidden: User has no registered business' }, { status: 403 });
    }

    // Parse requested updates from the body
    const body = await req.json();
    const { changes } = body;
    if (!changes || typeof changes !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid changes payload' }, { status: 400 });
    }

    // Process changes and convert custom serialized increments to Admin FieldValue.increment
    const adminChanges: any = {};
    const admin = await import('firebase-admin');
    const FieldValue = admin.firestore.FieldValue;

    for (const [key, val] of Object.entries(changes)) {
      if (val && typeof val === 'object' && (val as any)._type === 'increment') {
        adminChanges[key] = FieldValue.increment((val as any).value);
      } else {
        adminChanges[key] = val;
      }
    }

    // Set or update updatedAt timestamp
    adminChanges.updatedAt = new Date().toISOString();

    // Perform the write to businesses/{businessId}/settings/inventory
    const inventoryRef = adminDb.collection('businesses').doc(businessId).collection('settings').doc('inventory');
    await inventoryRef.update(adminChanges);

    console.log(`[InventoryAPI] Successfully updated settings/inventory for business ${businessId} (Triggered by user ${decodedToken.uid})`);

    return NextResponse.json({ success: true, message: 'Inventory updated successfully' });
  } catch (error: any) {
    console.error("[InventoryAPI] Fatal error updating inventory:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
