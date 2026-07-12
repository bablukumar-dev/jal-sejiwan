const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const firebaseConfig = require('./firebase-applet-config.json');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^["']|["']$/g, ''),
  })
});
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  const uid = 'pnospK2S05gTjs5B63aQY7jeU543';
  const doc = await db.collection('users').doc(uid).get();
  console.log("Modular DB Doc exists?", doc.exists);
}
test();
