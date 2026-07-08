import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

function initAdmin() {
  if (getApps().length > 0) {
    return getApp();
  }

  // Clean the private key
  let privateKey = serviceAccount.privateKey;
  if (privateKey) {
    // Replace literal \n with real newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    // Remove surrounding quotes if present (common in some environment setups)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    // Final check for PEM format consistency
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.warn('Firebase Private Key seems to be missing PEM header');
    }
  }

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !privateKey) {
    const missing = {
      projectId: !serviceAccount.projectId,
      clientEmail: !serviceAccount.clientEmail,
      privateKey: !privateKey
    };
    console.error('Firebase Admin credentials incomplete:', missing);
    throw new Error(`Firebase Admin credentials missing: ${Object.keys(missing).filter(k => (missing as any)[k]).join(', ')}`);
  }

  try {
    const app = initializeApp({
      credential: cert({
        projectId: serviceAccount.projectId,
        clientEmail: serviceAccount.clientEmail,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully for project:', serviceAccount.projectId);
    return app;
  } catch (error) {
    console.error('Error during initializeApp:', error);
    throw error;
  }
}

export const getAdminAuth = () => {
  const app = initAdmin();
  return getAuth(app);
};

export const getAdminDb = () => {
  const app = initAdmin();
  // Use the database ID from the platform config if available, otherwise default to undefined
  const databaseId = firebaseConfig.firestoreDatabaseId;
  
  if (!databaseId || databaseId === '(default)') {
    console.log('[FirebaseAdmin] Initializing Firestore with default database');
    return getFirestore(app);
  }
  
  console.log('[FirebaseAdmin] Initializing Firestore with databaseId:', databaseId);
  try {
    return getFirestore(app, databaseId);
  } catch (err) {
    console.error('[FirebaseAdmin] Failed to initialize Firestore with databaseId:', databaseId, err);
    // Fallback to default if named fails
    return getFirestore(app);
  }
};
