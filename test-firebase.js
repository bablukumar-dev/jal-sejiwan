const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
try {
  const db = getFirestore(app, config.firestoreDatabaseId);
  console.log("Success");
} catch(e) {
  console.log("Error:", e.code, e.message);
}
