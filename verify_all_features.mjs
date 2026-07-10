import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, updateDoc, increment } from 'firebase/firestore';
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
const db = getFirestore(app, config.firestoreDatabaseId);

async function verifyAll() {
  console.log("==========================================");
  console.log(" JALSEJIWAN ISOLATED RUNTIME VERIFICATION");
  console.log("==========================================");

  const timestamp = Date.now();
  const ownerEmail = `owner_verify_${timestamp}@jalsejiwan.test`;
  const ownerPassword = 'Password123!';
  const businessId = `biz_verify_${timestamp}`;
  const staffEmail = `staff_verify_${timestamp}@jalsejiwan.test`;
  const staffPin = '123456'; // At least 6 characters
  
  let ownerUid = null;
  let staffUid = null;

  // --- FEATURE 1: OWNER SIGNUP & ONBOARDING ---
  try {
    console.log("\n[RUNNING] 1. Owner Signup...");
    const cred = await createUserWithEmailAndPassword(auth, ownerEmail, ownerPassword);
    ownerUid = cred.user.uid;
    
    const userDocRef = doc(db, 'users', ownerUid);
    await setDoc(userDocRef, {
      email: ownerEmail,
      role: 'owner',
      businessId,
      active: true,
      createdAt: new Date().toISOString()
    });

    await setDoc(doc(db, 'businesses', businessId), {
      name: 'Verification Water Agency',
      ownerId: ownerUid,
      createdAt: new Date().toISOString()
    });

    console.log(" -> PASS: Owner registered.");
    console.log("    Firestore Path: users/" + ownerUid);
    console.log("    Business Path: businesses/" + businessId);
  } catch (err) {
    console.error(" -> FAIL: Owner registration failed:", err.message);
    process.exit(1);
  }

  // --- FEATURE 2: STAFF CREATION VIA ADMIN API ---
  try {
    console.log("\n[RUNNING] 2. Staff Creation via Admin API...");
    const idToken = await auth.currentUser.getIdToken();
    
    const response = await fetch('http://localhost:3000/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        email: staffEmail,
        password: staffPin,
        name: 'John Doe Staff',
        role: 'staff',
        business_id: businessId
      })
    });

    console.log("    API Response Status:", response.status);
    const result = await response.json();

    if (response.status !== 200 || !result.success) {
      throw new Error("API returned non-success response: " + JSON.stringify(result));
    }

    staffUid = result.userId;
    console.log(" -> PASS: Staff Auth User Created.");
    console.log("    Staff UID:", staffUid);

    // Verify Firestore users document exists
    const staffUserSnap = await getDoc(doc(db, 'users', staffUid));
    if (!staffUserSnap.exists()) {
      throw new Error("Staff user document users/" + staffUid + " does not exist!");
    }
    console.log(" -> PASS: Staff user document created.");
    console.log("    Firestore Path: users/" + staffUid);
    console.log("    Staff User Document Data:", JSON.stringify(staffUserSnap.data(), null, 2));

    // Verify staff subcollection document exists
    const staffSubSnap = await getDoc(doc(db, 'businesses', businessId, 'staff', staffUid));
    if (!staffSubSnap.exists()) {
      throw new Error("Staff businesses subcollection document does not exist!");
    }
    console.log(" -> PASS: Staff subcollection document created.");
    console.log("    Firestore Path: businesses/" + businessId + "/staff/" + staffUid);
    console.log("    Staff Subcollection Doc Data:", JSON.stringify(staffSubSnap.data(), null, 2));
  } catch (err) {
    console.error(" -> FAIL: Staff creation failed:", err.message);
    process.exit(1);
  }

  // --- FEATURE 3 & 4: DELIVER WATER & LIVE ACTIVITY LOGGING ---
  try {
    console.log("\n[RUNNING] 3. Water Delivery Simulation & Activity Logging...");

    // Create an initial inventory document
    const inventoryRef = doc(db, 'businesses', businessId, 'settings', 'inventory');
    await setDoc(inventoryRef, {
      fullCans: 100,
      emptyCans: 10,
      cansWithCustomers: 50,
      cansInDelivery: 10,
      updatedAt: new Date().toISOString()
    });
    console.log("    Initialized inventory document settings/inventory.");

    // Create a customer document
    const customerId = `cust_${timestamp}`;
    const customerRef = doc(db, 'businesses', businessId, 'customers', customerId);
    await setDoc(customerRef, {
      name: 'Alice Customer',
      due: 0,
      emptyBalance: 0,
      rate: 30,
      route: 'Route A',
      createdAt: new Date().toISOString()
    });
    console.log("    Initialized customer Alice.");

    // Create a delivery document
    const deliveryId = `del_${timestamp}`;
    const deliveryRef = doc(db, 'businesses', businessId, 'deliveries', deliveryId);
    await setDoc(deliveryRef, {
      customerId,
      customerName: 'Alice Customer',
      status: 'pending',
      date: new Date().toISOString()
    });
    console.log("    Initialized pending delivery document.");

    // Simulate signing in as Staff John Doe to perform the delivery
    await auth.signOut();
    const staffCred = await signInWithEmailAndPassword(auth, staffEmail, staffPin);
    console.log("    Logged in as Staff member John Doe.");

    const staffCurrentUser = {
      uid: staffCred.user.uid,
      role: 'staff',
      businessId
    };

    // --- EXECUTE DELIVERY FLOW ---
    console.log("    Executing handleConfirm delivery logic in isolation...");
    const delivered = 5;
    const empties = 3;
    const parsedAmount = 150;

    // 1. Update delivery doc
    try {
      console.log("    Attempting delivery update...");
      await updateDoc(deliveryRef, {
        status: 'delivered',
        deliveredQty: delivered,
        returnedEmpty: empties,
        paymentReceived: true,
        paymentAmount: parsedAmount,
        rate: 30
      });
      console.log("    -> Success: Delivery document updated.");
    } catch (e) {
      console.error("    -> FAIL: Delivery update failed:", e.message);
    }

    // 2. Update settings/inventory via our secure server-side API (just as the real browser code does)
    try {
      console.log("    Attempting inventory update via secure API...");
      const idToken = await staffCred.user.getIdToken();
      const apiResponse = await fetch('http://localhost:3000/api/inventory/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          changes: {
            cansWithCustomers: { _type: 'increment', value: delivered - empties }
          }
        })
      });
      const apiResult = await apiResponse.json();
      if (apiResponse.status === 200 && apiResult.success) {
        console.log("    -> Success: settings/inventory updated via API.");
      } else {
        throw new Error(apiResult.error || `HTTP ${apiResponse.status}`);
      }
    } catch (e) {
      console.error("    -> FAIL: Inventory update failed:", e.message);
    }

    // 3. Update customer Alice
    try {
      console.log("    Attempting customer update...");
      await updateDoc(customerRef, {
        due: 0,
        emptyBalance: increment(delivered - empties),
        lastDelivery: new Date().toISOString(),
        rate: 30
      });
      console.log("    -> Success: Customer updated.");
    } catch (e) {
      console.error("    -> FAIL: Customer update failed:", e.message);
    }

    // 4. Record payment
    try {
      console.log("    Attempting payment creation...");
      const paymentId = `pay_${timestamp}`;
      const paymentRef = doc(db, 'businesses', businessId, 'payments', paymentId);
      await setDoc(paymentRef, {
        customerId,
        customerName: 'Alice Customer',
        date: new Date().toISOString(),
        amount: parsedAmount,
        mode: 'Cash',
        collectedBy: 'John Doe Staff',
        note: `DEL-${deliveryId}`
      });
      console.log("    -> Success: Payment document recorded.");
    } catch (e) {
      console.error("    -> FAIL: Payment creation failed:", e.message);
    }

    // 5. Activity Logger invocation
    try {
      console.log("    Attempting activity log creation...");
      const activityLogsRef = collection(db, 'businesses', businessId, 'activityLogs');
      const logData = {
        activityId: `act_${timestamp}`,
        timestamp: new Date().toISOString(),
        userId: staffCurrentUser.uid,
        userName: 'John Doe Staff',
        email: staffEmail,
        role: 'staff',
        businessId,
        module: 'Water Management',
        action: 'Delivery Completed',
        description: `Completed delivery to Alice Customer: ${delivered} Cans, ${empties} Empties returned, payment ₹${parsedAmount}`,
        status: 'success',
        success: true,
        performedByUID: staffCurrentUser.uid,
        performedByName: 'John Doe Staff',
        performedByRole: 'staff',
        entity: 'Delivery',
        entityId: deliveryId,
        ip: '127.0.0.1'
      };
      const logDoc = await addDoc(activityLogsRef, logData);
      console.log("    -> Success: Live activity log created (ID: " + logDoc.id + ").");
    } catch (e) {
      console.error("    -> FAIL: Activity log creation failed:", e.message);
    }

  } catch (err) {
    console.error(" -> FAIL: Core flow simulation failed:", err.message);
    process.exit(1);
  }

  console.log("\n==========================================");
  console.log(" RUNTIME TRACE COMPLETE");
  console.log("==========================================");
  process.exit(0);
}

verifyAll();
