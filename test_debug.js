require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
console.log('[DEBUG] FIREBASE keys in process.env:', Object.keys(process.env).filter(k => k.startsWith('FIREBASE')));
console.log('[DEBUG] FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('[DEBUG] FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('[DEBUG] FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
