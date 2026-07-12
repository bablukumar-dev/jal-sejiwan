import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import * as dotenv from 'dotenv';
import path from 'path';

// Force load .env.local if not already loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Validates the firebase-admin configuration and credentials.
 * Throws a descriptive error if something is missing.
 */
function validateCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Crucial: Handle literal \n strings (common in env vars)
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Handle escaped quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
  }

  const errors: string[] = [];
  if (!projectId) errors.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) errors.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) errors.push('FIREBASE_PRIVATE_KEY');

  if (errors.length > 0) {
    const envKeys = Object.keys(process.env).filter(k => k.includes('FIREBASE'));
    console.error('[ADMIN INIT] Missing environment variables:', errors.join(', '));
    console.log('[ADMIN INIT] Available FIREBASE_* env keys:', JSON.stringify(envKeys));
    throw new Error(`Missing required Firebase environment variables: ${errors.join(', ')}. Available keys: ${envKeys.join(', ')}`);
  }

  return { projectId, clientEmail, privateKey };
}

let adminApp: App | null = null;

function initAdmin() {
  if (adminApp) return adminApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    console.log('[ADMIN INIT] Using existing Firebase Admin app');
    adminApp = existingApps[0];
    return adminApp;
  }

  console.log('[ADMIN INIT] Initializing new Firebase Admin app...');
  try {
    const { projectId, clientEmail, privateKey } = validateCredentials();

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
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
  return getAuth(app);
};

export const getAdminDb = () => {
  const app = initAdmin();
  const databaseId = firebaseConfig.firestoreDatabaseId;
  
  if (!databaseId || databaseId === '(default)') {
    return getFirestore(app);
  }
  
  try {
    return getFirestore(app, databaseId);
  } catch (err: any) {
    console.error('[ADMIN INIT] Firestore init error with databaseId:', databaseId, err.message);
    return getFirestore(app);
  }
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
