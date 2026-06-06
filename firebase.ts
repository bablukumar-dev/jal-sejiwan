import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDbdQtcLk1w6_svvQrMr2UUytwvB1k8qZI",
  authDomain: "gen-lang-client-0612602011.firebaseapp.com",
  projectId: "gen-lang-client-0612602011",
  storageBucket: "gen-lang-client-0612602011.firebasestorage.app",
  messagingSenderId: "769403451177",
  appId: "1:769403451177:web:a1c0e276ba5eca6c212938"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "ai-studio-cae216c6-03a8-4754-9008-9a7cf50a500a");
