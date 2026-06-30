import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDbdQtcLk1w6_svvQrMr2UUytwvB1k8qZI",
  authDomain: "gen-lang-client-0612602011.firebaseapp.com",
  projectId: "gen-lang-client-0612602011",
  storageBucket: "gen-lang-client-0612602011.firebasestorage.app",
  messagingSenderId: "769403451177",
  appId: "1:769403451177:web:a1c0e276ba5eca6c212938",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
