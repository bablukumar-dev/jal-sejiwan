import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Ensure Firebase config is correctly defined and check for core keys
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.warn("JalSejiwan Info: Core credentials are empty or missing inside firebase-applet-config.json. Please verify your Firebase project setup.");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Avoid "Firestore has already been initialized" exceptions in Next.js HMR/SSR cycles
let dbInstance;
try {
  dbInstance = initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);
} catch (error) {
  // Fallback to retrieving the existing initialized database instance
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;

