import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

// Ensure Firebase config is correctly defined and check for core keys
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.warn("JalSejiwan Info: Core credentials are empty or missing inside firebase-applet-config.json. Please verify your Firebase project setup.");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const storage = getStorage(app);

// Avoid "Firestore has already been initialized" exceptions in Next.js HMR/SSR cycles
export const db = !getApps().length ? getFirestore(app) : getFirestore(app);


