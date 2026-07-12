require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
const { getFirestore, collection, query, orderBy, limit, getDocs } = require('firebase/firestore');

const { initializeApp: adminInitApp, cert } = require('firebase-admin/app');
const { getAuth: adminGetAuth } = require('firebase-admin/auth');

const firebaseConfig = require('./firebase-applet-config.json');

const adminApp = adminInitApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^["']|["']$/g, ''),
  })
});
const adminAuth = adminGetAuth(adminApp);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  const customToken = await adminAuth.createCustomToken("pnospK2S05gTjs5B63aQY7jeU543");
  await signInWithCustomToken(auth, customToken);
  
  const businessId = "test-business-123";
  const logsQuery = query(
    collection(db, 'businesses', businessId, 'activityLogs'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  
  try {
    const snap = await getDocs(logsQuery);
    console.log("Docs retrieved:", snap.docs.length);
  } catch (e) {
    console.error("SNAPSHOT FAILED:", e.message);
  }
}
test();
test().then(() => process.exit(0));
