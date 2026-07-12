import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '../../../../src/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  if (!uid) return NextResponse.json({ error: 'no uid' });
  
  const adminDb = getAdminDb();
  const doc = await adminDb.collection('users').doc(uid).get();
  
  return NextResponse.json({
    exists: doc.exists,
    data: doc.data(),
    path: doc.ref.path
  });
}
