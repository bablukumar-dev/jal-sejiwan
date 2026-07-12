const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Project ID from env:', process.env.FIREBASE_PROJECT_ID);

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);

async function check() {
  const collections = await db.listCollections();
  console.log('Total collections found:', collections.length);
  for (const col of collections) {
    console.log('Collection ID:', col.id);
  }
}

check();
