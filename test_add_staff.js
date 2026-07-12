require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const firebaseConfig = require('./firebase-applet-config.json');

const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n').trim().replace(/^["']|["']$/g, '');

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});
const adminAuth = getAuth(app);
const adminDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runTest() {
  try {
    const testEmail = "test_owner@example.com";
    let userRecord = await adminAuth.getUserByEmail(testEmail).catch(() => null);
    if (!userRecord) {
      userRecord = await adminAuth.createUser({ email: testEmail, password: "password123", emailVerified: true });
    }
    const uid = userRecord.uid;
    const businessId = "test-business-123";

    await adminDb.collection('users').doc(uid).set({
      role: 'owner', name: 'Test Owner', email: testEmail,
      businesses: [businessId], workspaceId: businessId,
    });
    
    // Verify it is there!
    const doc = await adminDb.collection('users').doc(uid).get();
    console.log("Written doc exists in Named DB?", doc.exists);

    const customToken = await adminAuth.createCustomToken(uid);
    const fetch = require('node-fetch'); // actually, fetch is global in Node 18+
    const res = await globalThis.fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    });
    const data = await res.json();
    const idToken = data.idToken;

    const testStaffEmail = `staff_${Date.now()}@example.com`;
    const apiRes = await globalThis.fetch("http://localhost:3000/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({ email: testStaffEmail, password: "password123", role: "Delivery Partner", name: "Test Staff", business_id: businessId, routes: ["Test Route"] })
    });

    console.log("API Status:", apiRes.status);
    console.log("API Response Body:", await apiRes.text());
    
    if (apiRes.status === 200) console.log("✅ Add Staff API PASSED!");
  } catch (e) {
    console.error(e);
  }
}
runTest();
