import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  try {
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      initializeApp({
        credential: cert(serviceAccount as any),
      });
    } else {
      console.warn('Firebase admin credentials missing. Admin SDK will not be initialized.');
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const getAdminAuth = () => getAuth();
export const getAdminDb = () => {
  // Use the database ID from the platform config
  const databaseId = firebaseConfig.firestoreDatabaseId;
  return getFirestore(databaseId);
};
