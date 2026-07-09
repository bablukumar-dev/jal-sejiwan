import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Validates the firebase-admin configuration and credentials.
 * Throws a descriptive error if something is missing.
 */
function validateCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const errors: string[] = [];
  if (!projectId) errors.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) errors.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) errors.push('FIREBASE_PRIVATE_KEY');

  if (errors.length > 0) {
    console.error('[FirebaseAdmin] Missing environment variables:', errors.join(', '));
    throw new Error(`Missing required Firebase environment variables: ${errors.join(', ')}`);
  }

  // Basic format validation
  if (clientEmail && !clientEmail.includes('@')) {
    errors.push('FIREBASE_CLIENT_EMAIL format is invalid');
  }
  if (privateKey && !privateKey.includes('PRIVATE KEY')) {
    errors.push('FIREBASE_PRIVATE_KEY format is invalid (missing PEM headers)');
  }

  if (errors.length > 0) {
    console.error('[FirebaseAdmin] Invalid credentials format:', errors.join('. '));
    throw new Error(`Invalid Firebase credentials: ${errors.join('. ')}`);
  }

  return { projectId, clientEmail, privateKey };
}

function initAdmin() {
  const APP_NAME = 'admin-app';
  
  try {
    const existingApps = getApps();
    const adminApp = existingApps.find(app => app.name === APP_NAME);
    if (adminApp) {
      return adminApp;
    }

    const { projectId, clientEmail, privateKey: rawKey } = validateCredentials();

    // Clean the private key rigorously
    let privateKey = rawKey;
    if (privateKey) {
      // 1. Handle literal \n strings (common in env vars)
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // 2. Handle escaped quotes
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
      }
      
      // 3. Trim whitespace but keep newlines
      privateKey = privateKey.trim();
      
      // 4. Ensure it has the correct header/footer
      if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}`;
      }
      if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
        privateKey = `${privateKey}\n-----END PRIVATE KEY-----`;
      }
    }

    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    }, APP_NAME);

    console.log('[FirebaseAdmin] Initialized successfully for project:', projectId);
    return app;
  } catch (error: any) {
    console.error('[FirebaseAdmin] Initialization failure:', error.message);
    
    // Recovery: If it's a duplicate app error, try to return the existing one
    if (error.code === 'app/duplicate-app') {
      try {
        return getApp(APP_NAME);
      } catch (innerError) {
        throw error;
      }
    }
    throw error;
  }
}

export const getAdminAuth = () => {
  const app = initAdmin();
  return getAuth(app);
};

export const getAdminDb = () => {
  const app = initAdmin();
  
  // Use the database ID from the platform config
  // In AI Studio, this is often a long string like ai-studio-jalsejiwan-...
  const databaseId = firebaseConfig.firestoreDatabaseId;
  
  if (!databaseId || databaseId === '(default)') {
    console.log('[FirebaseAdmin] Using default Firestore database');
    return getFirestore(app);
  }
  
  try {
    console.log('[FirebaseAdmin] Using Firestore databaseId:', databaseId);
    return getFirestore(app, databaseId);
  } catch (err: any) {
    console.error('[FirebaseAdmin] Firestore init error with databaseId:', databaseId, err.message);
    // Fallback to default
    return getFirestore(app);
  }
};

/**
 * Diagnostics function to check if the admin SDK is ready
 */
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
