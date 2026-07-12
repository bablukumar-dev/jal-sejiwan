require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const firebaseConfig = require('./firebase-applet-config.json');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^["']|["']$/g, ''),
  })
});
const adminAuth = getAuth(app);

async function runTest() {
  try {
    const uid = 'pnospK2S05gTjs5B63aQY7jeU543'; // Owner UID
    const customToken = await adminAuth.createCustomToken(uid);
    const res = await globalThis.fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    });
    const data = await res.json();
    const idToken = data.idToken;

    const payload = {
      email: "ferije2369_2@epaynine.com",
      password: "122533s",
      name: "an",
      role: "Delivery Partner", // Changed to match frontend screenshot
      business_id: "test-business-123",
      route: "khaira"
    };

    const apiRes = await globalThis.fetch("http://localhost:3000/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify(payload)
    });

    console.log("API Status:", apiRes.status);
    console.log("API Response Body:", await apiRes.text());
  } catch (e) {
    console.error(e);
  }
}
runTest();
