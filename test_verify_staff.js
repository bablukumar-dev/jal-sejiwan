require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
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

async function verify() {
  const businessId = "test-business-123";
  const userId = "SjO48uV8qkVOjMdDq3N9GY2Ry363";
  
  const userDoc = await db.collection('users').doc(userId).get();
  console.log("1. User document:", userDoc.exists ? "✅ PASS" : "❌ FAIL");
  
  const staffDoc = await db.collection(`businesses/${businessId}/staff`).doc(userId).get();
  console.log("2. Staff document:", staffDoc.exists ? "✅ PASS" : "❌ FAIL");
  
  const activityLogs = await db.collection(`businesses/${businessId}/activityLogs`).orderBy('timestamp', 'desc').limit(1).get();
  if (activityLogs.empty) {
    console.log("3. Activity Log:", "❌ FAIL");
  } else {
    console.log("3. Activity Log:", "✅ PASS", "(Action: " + activityLogs.docs[0].data().action + ")");
  }
}
verify();
