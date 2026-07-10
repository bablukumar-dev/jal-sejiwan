import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function run() {
  try {
    console.log("Logging in as owner...");
    // Let's create a new owner user for this trace to ensure it exists
    const email = `owner_trace_${Date.now()}@jalsejiwan.test`;
    const password = 'Password123!';
    
    // We can import createUserWithEmailAndPassword
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    console.log("Created owner account:", email);
    
    // Create the users/ document in firestore for this user
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
    const db = getFirestore(app, config.firestoreDatabaseId);
    const businessId = `biz_trace_${Date.now()}`;
    
    await setDoc(doc(db, 'users', user.uid), {
      email,
      role: 'owner',
      businessId,
      active: true,
      createdAt: new Date().toISOString()
    });
    console.log("Created user profile users/" + user.uid);

    // Create business doc
    await setDoc(doc(db, 'businesses', businessId), {
      name: 'Trace Business',
      ownerId: user.uid,
      createdAt: new Date().toISOString()
    });
    console.log("Created business profile businesses/" + businessId);

    const idToken = await user.getIdToken();
    console.log("Got owner ID token.");

    console.log("Calling /api/admin/create-user...");
    const response = await fetch('http://localhost:3000/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        email: `staff_trace_${Date.now()}@jalsejiwan.test`,
        password: '123456', // 6-digit PIN
        name: 'Staff Trace',
        role: 'staff',
        business_id: businessId
      })
    });

    console.log("Status Code:", response.status);
    const result = await response.json();
    console.log("Response JSON:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("Trace failed:", error.message);
  }
  process.exit(0);
}

run();
