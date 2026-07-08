import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Ensure we handle the newline replacement safely
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
};

if (!getApps().length) {
  try {
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      initializeApp({
        credential: cert(serviceAccount as any),
      });
      console.log('Firebase Admin initialized successfully for project:', serviceAccount.projectId);
    } else {
      console.error('Firebase admin credentials incomplete. Missing:', {
        projectId: !serviceAccount.projectId,
        clientEmail: !serviceAccount.clientEmail,
        privateKey: !serviceAccount.privateKey
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const getAdminAuth = () => getAuth();
export const getAdminDb = () => {
  // Use the database ID from the platform config if available, otherwise default to undefined
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  console.log('Initializing Firestore with databaseId:', databaseId);
  return getFirestore(databaseId);
};
