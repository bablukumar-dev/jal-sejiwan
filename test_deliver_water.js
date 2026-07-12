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
    const uid = 'pnospK2S05gTjs5B63aQY7jeU543'; // owner from before
    const businessId = "test-business-123";

    const customToken = await adminAuth.createCustomToken(uid);
    const res = await globalThis.fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    });
    const data = await res.json();
    const idToken = data.idToken;

    const newDelivery = {
      customerId: "cust-1",
      customerName: "Test Customer",
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      staffId: uid,
      staffName: "Test Owner",
      deliveredQty: 0,
      returnedEmpty: 0,
      paymentReceived: false,
      paymentAmount: 0,
      paymentMode: 'Cash',
      note: ''
    };

    const apiRes = await globalThis.fetch("http://localhost:3000/api/deliver-water", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({ deliveries: [newDelivery], businessId })
    });

    console.log("API Status:", apiRes.status);
    console.log("API Response Body:", await apiRes.text());
    
    if (apiRes.status === 200) {
      console.log("✅ Deliver Water API PASSED!");
      
      const activityLogs = await adminDb.collection(`businesses/${businessId}/activityLogs`).orderBy('timestamp', 'desc').limit(1).get();
      if (!activityLogs.empty && activityLogs.docs[0].data().action === "Deliver Water Created") {
        console.log("✅ Deliver Water Activity Log PASSED!");
      }
    }
  } catch (e) {
    console.error(e);
  }
}
runTest();
