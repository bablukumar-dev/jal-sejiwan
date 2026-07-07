import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from '../../firebase-applet-config.json';

let app: any;
let auth: any;
let db: any;

export const getFirebase = () => {
  if (typeof window === 'undefined') {
    return { auth: null, db: null };
  }
  if (!app) {
    try {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
      auth = getAuth(app);
      // Use the database ID from the platform config
      const databaseId = firebaseConfig.firestoreDatabaseId; 
      db = getFirestore(app, databaseId);
      console.log("Firebase initialized with project:", firebaseConfig.projectId, "and database:", databaseId);
    } catch (error) {
      console.error("Firebase Initialization Error:", error);
      return { auth: null, db: null };
    }
  }
  return { auth, db };
};
