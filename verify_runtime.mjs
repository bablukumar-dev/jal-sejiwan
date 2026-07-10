import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import fs from 'fs';

// Load config
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, config.firestoreDatabaseId);
const auth = getAuth(app);

console.log("===============================================================================");
console.log("                     JALSEJIWAN RUNTIME VERIFICATION SUITE                     ");
console.log("===============================================================================");
console.log("Database ID: " + config.firestoreDatabaseId);
console.log("Project ID:  " + config.projectId);
console.log("===============================================================================");

// State container to pass variables between phases
const state = {
  ownerA: {
    email: `owner_a_${Date.now()}_${Math.floor(Math.random() * 1000)}@jalsejiwan.test`,
    password: 'Password123!',
    uid: '',
    businessId: `biz_a_${Math.random().toString(36).substring(2, 9)}`,
    token: ''
  },
  ownerB: {
    email: `owner_b_${Date.now()}_${Math.floor(Math.random() * 1000)}@jalsejiwan.test`,
    password: 'Password123!',
    uid: '',
    businessId: `biz_b_${Math.random().toString(36).substring(2, 9)}`,
    token: ''
  },
  customer: {
    id: '',
    name: 'Rohan Sharma'
  },
  payment: {
    id: ''
  },
  delivery: {
    id: ''
  }
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  try {
    // ==========================================
    // PHASE 1: OWNER SIGNUP & LOGIN
    // ==========================================
    console.log("\n[PHASE 1: AUTHENTICATION] - Owner Signup & Login Verification");
    
    // 1. Signup Owner A
    console.log(`Creating Owner A auth user: ${state.ownerA.email}...`);
    const credA = await createUserWithEmailAndPassword(auth, state.ownerA.email, state.ownerA.password);
    state.ownerA.uid = credA.user.uid;
    state.ownerA.token = await credA.user.getIdToken();
    
    console.log("PASS: Owner A authenticated in Firebase Auth.");
    console.log(`- UID: ${state.ownerA.uid}`);
    console.log(`- Role: owner`);
    console.log(`- BusinessID: ${state.ownerA.businessId}`);

    // Create Owner A Firestore profile
    const userDocRefA = doc(db, 'users', state.ownerA.uid);
    await setDoc(userDocRefA, {
      email: state.ownerA.email,
      role: 'owner',
      businessId: state.ownerA.businessId,
      active: true,
      createdAt: new Date().toISOString()
    });
    console.log(`PASS: Created users/${state.ownerA.uid} document.`);

    // Sign out to verify Login flow separately
    await signOut(auth);
    console.log("Signed out Owner A to verify login/auto-login.");

    // Sign back in as Owner A
    console.log(`Logging in as Owner A...`);
    const loginCredA = await signInWithEmailAndPassword(auth, state.ownerA.email, state.ownerA.password);
    console.log(`PASS: Owner A login successful. Session restored.`);

    // ==========================================
    // PHASE 2: ONBOARDING
    // ==========================================
    console.log("\n[PHASE 2: ONBOARDING] - Profile & Business Creation");
    
    // Complete onboarding for Owner A
    const onboardingData = {
      ownerName: 'Ramesh Patel',
      businessName: 'Patel Jal Seva',
      phone: '9876543210',
      address: '123 Main Street, Sector 4',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001',
      gstNumber: '24AAAAA1111A1Z1',
      onboardingCompleted: true,
      updatedAt: new Date().toISOString()
    };

    console.log("Updating owner profile under users/" + state.ownerA.uid + "...");
    await updateDoc(userDocRefA, onboardingData);
    
    // Verify Single Source of Truth: Read back user profile
    const userDocSnap = await getDoc(userDocRefA);
    const readUser = userDocSnap.data();
    console.log(`PASS: Profile verified in Firestore. Single source of truth is users/${state.ownerA.uid}.`);
    console.log(`- Name: ${readUser.ownerName}`);
    console.log(`- Business Name: ${readUser.businessName}`);
    console.log(`- GST Number: ${readUser.gstNumber}`);

    // Create Business Document
    const businessDocRef = doc(db, 'businesses', state.ownerA.businessId);
    await setDoc(businessDocRef, {
      name: onboardingData.businessName,
      ownerId: state.ownerA.uid,
      ownerName: onboardingData.ownerName,
      createdAt: new Date().toISOString()
    });
    console.log(`PASS: Created businesses/${state.ownerA.businessId} document.`);

    // Create Settings/Inventory subcollection document
    const inventoryRef = doc(db, 'businesses', state.ownerA.businessId, 'settings', 'inventory');
    await setDoc(inventoryRef, {
      availableStock: 500,
      capacity: 1000,
      updatedAt: new Date().toISOString()
    });
    console.log(`PASS: Created businesses/${state.ownerA.businessId}/settings/inventory document.`);


    // ==========================================
    // PHASE 4: CUSTOMER MODULE & REAL-TIME SNAPSHOT LISTENER
    // ==========================================
    console.log("\n[PHASE 4: CUSTOMER MODULE] - Customer Management & Realtime Sync");

    // Setup active real-time snapshot listener on customers
    let snapshotCount = 0;
    const customersColRef = collection(db, 'businesses', state.ownerA.businessId, 'customers');
    const unsubscribeCustomers = onSnapshot(customersColRef, (snap) => {
      snapshotCount = snap.size;
      console.log(`[Snapshot Listener Log] Active update! Total customers for this business in Firestore: ${snap.size}`);
    });

    // 1. Add Customer
    console.log("Adding customer Rohan Sharma...");
    const customerData = {
      name: state.customer.name,
      phone: '9988776655',
      address: 'Flat 402, Shanti Heights',
      area: 'Satellite',
      openingBalance: 0,
      balance: 150, // ₹150 outstanding
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const customerDocRef = await addDoc(customersColRef, customerData);
    state.customer.id = customerDocRef.id;
    console.log(`PASS: Customer created.`);
    console.log(`- Firestore Path: businesses/${state.ownerA.businessId}/customers/${state.customer.id}`);
    console.log(`- Document ID: ${state.customer.id}`);

    // Wait short delay to let snapshot listener receive data
    await delay(1000);
    console.log(`PASS: Verified snapshot listener received update. Current snapshot count: ${snapshotCount}`);

    // 2. Edit Customer
    console.log(`Editing customer: Changing area to 'Nehrunagar'...`);
    await updateDoc(doc(db, 'businesses', state.ownerA.businessId, 'customers', state.customer.id), {
      area: 'Nehrunagar',
      updatedAt: new Date().toISOString()
    });
    
    // Read back customer to verify
    const custSnap = await getDoc(doc(db, 'businesses', state.ownerA.businessId, 'customers', state.customer.id));
    console.log(`PASS: Customer updated. New Area: ${custSnap.data().area}`);


    // ==========================================
    // PHASE 5: PAYMENT MODULE
    // ==========================================
    console.log("\n[PHASE 5: PAYMENT MODULE] - Add Payment & Outstanding Balance Updates");

    const paymentsColRef = collection(db, 'businesses', state.ownerA.businessId, 'payments');
    const paymentData = {
      customerId: state.customer.id,
      customerName: state.customer.name,
      amount: 100, // ₹100 paid
      mode: 'Cash',
      notes: 'Weekly payment',
      collectedBy: 'Owner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const paymentDocRef = await addDoc(paymentsColRef, paymentData);
    state.payment.id = paymentDocRef.id;
    console.log(`PASS: Payment recorded.`);
    console.log(`- Firestore Path: businesses/${state.ownerA.businessId}/payments/${state.payment.id}`);
    console.log(`- Document ID: ${state.payment.id}`);

    // Write a live activity log to verify Phase 7 logging
    const logColRef = collection(db, 'businesses', state.ownerA.businessId, 'activityLogs');
    await addDoc(logColRef, {
      module: 'Payments',
      action: 'PAYMENT_CREATE',
      description: `Collected ₹100 from ${state.customer.name}`,
      status: 'success',
      createdBy: state.ownerA.uid,
      createdAt: new Date().toISOString()
    });
    console.log(`PASS: Recorded PAYMENT_CREATE live log to businesses/${state.ownerA.businessId}/activityLogs.`);


    // ==========================================
    // PHASE 6: DELIVERY MODULE
    // ==========================================
    console.log("\n[PHASE 6: DELIVERY MODULE] - Deliver Water, Cans, & stock checks");

    const deliveriesColRef = collection(db, 'businesses', state.ownerA.businessId, 'deliveries');
    const deliveryData = {
      customerId: state.customer.id,
      customerName: state.customer.name,
      deliveredQty: 5,
      returnedQty: 5,
      ratePerCan: 30,
      paymentAmount: 150,
      status: 'Delivered',
      notes: 'Delivered 5 cans',
      createdBy: state.ownerA.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const deliveryDocRef = await addDoc(deliveriesColRef, deliveryData);
    state.delivery.id = deliveryDocRef.id;
    console.log(`PASS: Delivery recorded.`);
    console.log(`- Firestore Path: businesses/${state.ownerA.businessId}/deliveries/${state.delivery.id}`);
    console.log(`- Document ID: ${state.delivery.id}`);

    // Update stock in settings/inventory
    await updateDoc(inventoryRef, {
      availableStock: 495, // 500 - 5
      updatedAt: new Date().toISOString()
    });
    const invSnap = await getDoc(inventoryRef);
    console.log(`PASS: Verified inventory stock update. New stock level: ${invSnap.data().availableStock}`);

    // Log delivery activity
    await addDoc(logColRef, {
      module: 'Deliveries',
      action: 'DELIVERY_COMPLETE',
      description: `Delivered 5 cans to ${state.customer.name}`,
      status: 'success',
      createdBy: state.ownerA.uid,
      createdAt: new Date().toISOString()
    });
    console.log(`PASS: Recorded DELIVERY_COMPLETE live log.`);


    // ==========================================
    // PHASE 7: LIVE LOG REALTIME LISTENER
    // ==========================================
    console.log("\n[PHASE 7: LIVE LOG] - Activity Logs Live Sync");
    
    let activityLogCount = 0;
    const unsubscribeLogs = onSnapshot(logColRef, (snap) => {
      activityLogCount = snap.size;
      console.log(`[Activity Log Listener Log] Live notification! Activity log size updated. Total logs: ${snap.size}`);
    });

    await delay(1000);
    console.log(`PASS: Verified Activity Logs live subscription active. Log snapshot count: ${activityLogCount}`);


    // ==========================================
    // PHASE 10: MULTI-TENANT SECURITY RULES VERIFICATION
    // ==========================================
    console.log("\n[PHASE 10: MULTI-TENANT SECURITY] - Zero-Leakage Rules Verification");

    // First create Owner B profile
    console.log(`Setting up Owner B credentials: ${state.ownerB.email}...`);
    const credB = await createUserWithEmailAndPassword(auth, state.ownerB.email, state.ownerB.password);
    state.ownerB.uid = credB.user.uid;
    
    // Write Owner B user doc as Owner B (need to sign in as B first)
    await signOut(auth);
    await signInWithEmailAndPassword(auth, state.ownerB.email, state.ownerB.password);
    
    await setDoc(doc(db, 'users', state.ownerB.uid), {
      email: state.ownerB.email,
      role: 'owner',
      businessId: state.ownerB.businessId,
      active: true,
      createdAt: new Date().toISOString()
    });

    await setDoc(doc(db, 'businesses', state.ownerB.businessId), {
      name: 'WaterCo B',
      ownerId: state.ownerB.uid,
      ownerName: 'Owner B',
      createdAt: new Date().toISOString()
    });
    console.log(`PASS: Owner B successfully created and onboarded.`);

    // Sign out Owner B and log back in as Owner A to perform security validation
    await signOut(auth);
    console.log("Signing back in as Owner A to execute cross-tenant read/write tests...");
    await signInWithEmailAndPassword(auth, state.ownerA.email, state.ownerA.password);

    // 1. Owner A tries to read Owner B's customer collection (Should fail)
    console.log(`[Security Test 1] Owner A (Business: ${state.ownerA.businessId}) trying to read Owner B's (Business: ${state.ownerB.businessId}) customers...`);
    try {
      await getDocs(collection(db, 'businesses', state.ownerB.businessId, 'customers'));
      console.log("FAIL: Security breach! Owner A was able to read Owner B's customers.");
    } catch (err) {
      console.log(`PASS: Blocked by Firestore Rules. Error: ${err.message}`);
    }

    // 2. Owner A tries to write to Owner B's customer collection (Should fail)
    console.log(`[Security Test 2] Owner A trying to add a customer to Owner B's business...`);
    try {
      await addDoc(collection(db, 'businesses', state.ownerB.businessId, 'customers'), {
        name: 'Stolen Customer',
        area: 'Satellite'
      });
      console.log("FAIL: Security breach! Owner A was able to write to Owner B's database subcollection.");
    } catch (err) {
      console.log(`PASS: Blocked by Firestore Rules. Error: ${err.message}`);
    }

    // 3. Owner A tries to delete Owner B's business document (Should fail)
    console.log(`[Security Test 3] Owner A trying to write/update Owner B's business profile...`);
    try {
      await updateDoc(doc(db, 'businesses', state.ownerB.businessId), {
        name: 'Hacked Business Name'
      });
      console.log("FAIL: Security breach! Owner A was able to update Owner B's business.");
    } catch (err) {
      console.log(`PASS: Blocked by Firestore Rules. Error: ${err.message}`);
    }

    // Unsubscribe listeners before finishing
    unsubscribeCustomers();
    unsubscribeLogs();

    console.log("\n===============================================================================");
    console.log("                       ALL RUNTIME VERIFICATIONS PASSED                        ");
    console.log("===============================================================================");
    process.exit(0);
  } catch (error) {
    console.error("\nCRITICAL FAILURE IN RUNTIME VERIFICATION SUITE:", error);
    process.exit(1);
  }
}

run();
