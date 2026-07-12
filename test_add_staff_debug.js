require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
const admin = require('firebase-admin');
const firebaseConfig = require('./firebase-applet-config.json');

const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n').trim().replace(/^["']|["']$/g, '');
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: projectId,
    clientEmail: clientEmail,
    privateKey: privateKey,
  }),
});

const adminAuth = admin.auth();
const adminDb = admin.firestore(admin.app(), firebaseConfig.firestoreDatabaseId);

async function runTest() {
  const testEmail = "test_owner@example.com";
  let userRecord = await adminAuth.getUserByEmail(testEmail).catch(() => null);
  console.log("UID:", userRecord.uid);
  
  const doc = await adminDb.collection('users').doc(userRecord.uid).get();
  console.log("Doc exists?", doc.exists);
  if (doc.exists) console.log("Doc data:", doc.data());
}
runTest();
