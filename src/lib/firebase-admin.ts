import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Validates the firebase-admin configuration and credentials.
 * Throws a descriptive error if something is missing.
 */
function validateCredentials() {
  console.log('[DEBUG] process.cwd():', process.cwd());
  console.log('[DEBUG] FIREBASE keys in process.env:', Object.keys(process.env).filter(k => k.startsWith('FIREBASE')));
  
  const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log('[DEBUG] projectId:', !!projectId, projectId);
  console.log('[DEBUG] clientEmail:', !!clientEmail);
  console.log('[DEBUG] privateKeyExists:', !!privateKey);

  if (privateKey) {
    // 1. Unescape literal \n
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // 2. Trim whitespace
    privateKey = privateKey.trim();

    // 3. Remove surrounding quotes if they exist
    privateKey = privateKey.replace(/^["']|["']$/g, '');

    // Debugging as requested
    console.log('[DEBUG] Private Key Length:', privateKey.length);
    console.log('[DEBUG] Private Key Start:', privateKey.substring(0, 30));
    console.log('[DEBUG] Private Key End:', privateKey.substring(privateKey.length - 30));
  }

  const errors: string[] = [];
  if (!projectId) errors.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) errors.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) errors.push('FIREBASE_PRIVATE_KEY');

  if (errors.length > 0) {
    // Log clearly for diagnosis, but don't show all env keys
    console.error('[ADMIN INIT] Missing environment variables:', errors.join(', '));
    throw new Error(`Missing required Firebase environment variables: ${errors.join(', ')}`);
  }

  return { projectId, clientEmail, privateKey };
}

let adminApp: admin.app.App | null = null;

function initAdmin() {
  if (adminApp) return adminApp;

  const existingApps = admin.apps;
  if (existingApps.length > 0) {
    console.log('[ADMIN INIT] Using existing Firebase Admin app');
    adminApp = existingApps[0];
    return adminApp;
  }

  console.log('[ADMIN INIT] Initializing new Firebase Admin app...');
  try {
    const { projectId, clientEmail, privateKey } = validateCredentials();

    const credentials = {
        project_id: projectId as string,
        client_email: clientEmail as string,
        private_key: privateKey as string,
    };
    console.log('[DEBUG] Credential keys:', Object.keys(credentials));
    
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });

    console.log('[ADMIN INIT] Firebase Admin SDK initialized successfully for project:', projectId);
    return adminApp;
  } catch (error: any) {
    console.error('[ADMIN INIT] Initialization failure:', error.message);
    throw error;
  }
}

export const getAdminAuth = () => {
  const app = initAdmin();
  return admin.auth(app);
};

export const getAdminDb = () => {
  const app = initAdmin();
  return getFirestore(app, firebaseConfig.firestoreDatabaseId);
};

export const checkAdminStatus = () => {
  try {
    const { projectId, clientEmail } = validateCredentials();
    return {
      status: 'ready',
      projectId,
      clientEmail: clientEmail.substring(0, 5) + '...',
      usingDatabaseId: firebaseConfig.firestoreDatabaseId || '(default)'
    };
  } catch (e: any) {
    return {
      status: 'error',
      message: e.message
    };
  }
};
