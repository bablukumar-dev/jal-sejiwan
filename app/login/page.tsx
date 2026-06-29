'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Droplet, Store, Truck, Package, Mail, Lock, User, Phone } from 'lucide-react';
import { auth, db } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification, signOut, browserPopupRedirectResolver, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useAppContext } from '@/app/context/AppContext';
import { comparePin } from '@/lib/authHelper';
import { checkClientRateLimit, checkFirestoreLoginRateLimit, recordFailedLoginAttempt, resetFailedLoginAttempts } from '@/lib/rateLimit';
import { logActivity } from '@/lib/activityLogger';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const getLockTime = () => {
  return new Date(Date.now() + 15 * 60000).toISOString();
};

export default function Login() {
  const router = useRouter();
  const { staff, setStaff } = useAppContext();
  const [role, setRole] = useState<'owner' | 'staff' | 'manager'>('owner');
  
  // Email state (Owner)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Phone/PIN state (Staff/Manager)
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('expired=true')) {
      const timer = setTimeout(() => {
        setError('Session expired due to 30 minutes of inactivity. Please log in again.');
      }, 0);
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStaffLogin = async () => {
    if (typeof window === "undefined") return;

    const cleanPhone = phone.trim();
    setIsLoading(true);
    setError('');

    // Firestore-backed login rate limiting (5 failed attempts in 10 minutes)
    const firestoreLimit = await checkFirestoreLoginRateLimit(cleanPhone);
    if (firestoreLimit.limited) {
      setError(firestoreLimit.msg || 'Too many failed login attempts. Temporarily blocked.');
      setIsLoading(false);
      return;
    }

    // Rate limit login attempts to max 5 within 60 seconds of any single session
    const limitStatus = checkClientRateLimit('login_attempts', 5, 60);
    if (limitStatus.limited) {
      setError(limitStatus.msg || 'Too many sign-in attempts. Please try again after 1 minute.');
      setIsLoading(false);
      return;
    }

    const normalizedRole = role === 'staff' ? 'Delivery Partner' : 'Manager';
    
    try {
      // Clear out any stale Firebase Auth user session on local browser before PIN login
      try {
        await auth.signOut();
      } catch (e) {
        console.warn("Sign out during custom auth setup failed", e);
      }

      const docRef = doc(db, 'staff_users', cleanPhone);
      const docSnap = await getDoc(docRef);
      
      let s: any = null;
      let ownerIdFromFirestore = null;
      
      if (docSnap.exists()) {
        s = docSnap.data();
        ownerIdFromFirestore = s.ownerId;
      } else {
        // Fallback to local storage for backward compatibility if not synced yet
        s = staff.find(st => st.phone.trim() === cleanPhone && st.role === normalizedRole);
        if (!s) s = staff.find(st => st.phone.trim() === cleanPhone);
      }

      if (!s) {
        setError('User not found. Please contact Owner.');
        setIsLoading(false);
        return;
      }
      
      if (!s.active) {
         setError('Account disabled');
         setIsLoading(false);
         return;
      }

      const isLocked = s.pinLockedUntil && 
                       s.failedPinAttempts >= 5 && 
                       new Date(s.pinLockedUntil) > new Date();
      if (isLocked) {
         setError('Account temporarily locked. Contact Owner.');
         setIsLoading(false);
         return;
      }

      let isMatch = false;
      if (s.encryptedPin) {
         isMatch = comparePin(pin, s.encryptedPin);
      } else {
         isMatch = s.pin === pin;
      }

      if (!isMatch) {
         await recordFailedLoginAttempt(cleanPhone);
         const failedAttempts = (s.failedPinAttempts || 0) + 1;
         
         // Temporary localStorage setup for logging purposes
         if (s.businessId) {
           localStorage.setItem('businessId', s.businessId);
           localStorage.setItem('ownerId', s.ownerId || '');
         }

         if (failedAttempts >= 5) {
           logActivity(
             'account_locked',
             `Account locked for ${cleanPhone} (${normalizedRole}) due to 5 failed PIN attempts`,
             { phone: cleanPhone, role: normalizedRole }
           );
         } else {
           logActivity(
             'failed_login',
             `Wrong PIN entered for ${cleanPhone} (${normalizedRole}). Attempt: ${failedAttempts}/5`,
             { phone: cleanPhone, role: normalizedRole, failedAttempts }
           );
         }

         // Update both Firestore and local state
         if (docSnap.exists()) {
           const updateData: any = { failedPinAttempts: failedAttempts };
           if (failedAttempts >= 5) {
             updateData.pinLockedUntil = getLockTime();
             setError('Account temporarily locked. Contact Owner.');
           } else {
             setError(`Wrong password. Attempts remaining: ${5 - failedAttempts}`);
           }
           await setDoc(docRef, updateData, { merge: true });
         } else {
           const updatedStaff = [...staff];
           const idx = updatedStaff.findIndex(st => st.id === s!.id);
           updatedStaff[idx] = { ...s, failedPinAttempts: failedAttempts };
           if (failedAttempts >= 5) {
             updatedStaff[idx].pinLockedUntil = getLockTime();
             setError('Account temporarily locked. Contact Owner.');
           } else {
             setError(`Wrong password. Attempts remaining: ${5 - failedAttempts}`);
           }
           setStaff(updatedStaff);
         }
         setIsLoading(false);
         return;
      }

      // Success! Reset attempts.
      await resetFailedLoginAttempts(cleanPhone);
      if (docSnap.exists()) {
         await setDoc(docRef, { failedPinAttempts: 0, pinLockedUntil: null }, { merge: true });
         
         // Also update local staff arrays in state if found
         const updatedStaff = [...staff];
         const idx = updatedStaff.findIndex(st => st.phone.trim() === cleanPhone);
         if (idx !== -1) {
           updatedStaff[idx] = { ...updatedStaff[idx], failedPinAttempts: 0, pinLockedUntil: undefined };
           setStaff(updatedStaff);
         }
      } else {
        const updatedStaff = [...staff];
        const idx = updatedStaff.findIndex(st => st.id === s!.id);
        if (idx !== -1) {
          updatedStaff[idx] = { ...s, failedPinAttempts: 0, pinLockedUntil: undefined };
          setStaff(updatedStaff);
        }
      }

      // NEW: Firebase Anonymous Authentication for Staff/Managers
      const { signInAnonymously } = await import('firebase/auth');
      const staffAuthResult = await signInAnonymously(auth);
      const staffUid = staffAuthResult.user.uid;

      localStorage.setItem('pinAuth', 'true');
      localStorage.setItem('staffUserId', String(s.id));
      localStorage.setItem('staffUserName', s.name);
      localStorage.setItem('staffPhone', cleanPhone);
      
      let businessId = 'default_business';
      if (s.businessId && s.businessId !== 'default_business') {
        businessId = s.businessId;
      } else if (ownerIdFromFirestore) {
        try {
          const { query, collection, where, getDocs } = await import('firebase/firestore');
          const q = query(collection(db, "businesses"), where("ownerId", "==", ownerIdFromFirestore));
          const qSnapshot = await getDocs(q);
          if (!qSnapshot.empty) {
            businessId = qSnapshot.docs[0].id;
            await setDoc(doc(db, 'staff_users', cleanPhone), { businessId }, { merge: true });
          }
        } catch (err) {
          console.error("Staff login businessId resolution error", err);
        }
      }

      // NEW: Create/Update user document for the anonymous staff member
      await setDoc(doc(db, 'users', staffUid), {
        name: s.name,
        phone: cleanPhone,
        role: normalizedRole,
        businessId: businessId,
        isAnonymous: true,
        lastLogin: serverTimestamp()
      }, { merge: true });

      const targetRole = s.role === 'Manager' ? 'manager' : 'staff';

      localStorage.setItem('businessId', businessId);
      if (ownerIdFromFirestore) {
         localStorage.setItem('ownerId', ownerIdFromFirestore);
      }
      
      redirectBasedOnRole(targetRole);

    } catch (e) {
      console.error("Login Error", e);
      setError("Login failed. Check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = () => {
     if (role === 'owner') {
         handleEmailAuth();
     } else {
         handleStaffLogin();
     }
  };

  const handleEmailAuth = async () => {
    if (typeof window === "undefined") return;

    const cleanEmail = email.trim();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // Firestore-backed login rate limiting
    const firestoreLimit = await checkFirestoreLoginRateLimit(cleanEmail);
    if (firestoreLimit.limited) {
      setError(firestoreLimit.msg || 'Too many failed login attempts. Temporarily blocked.');
      setIsLoading(false);
      return;
    }

    // Rate limit email auth attempts to max 5 within 60 seconds
    const limitStatus = checkClientRateLimit('login_attempts', 5, 60);
    if (limitStatus.limited) {
      setError(limitStatus.msg || 'Too many sign-in attempts. Please try again after 1 minute.');
      setIsLoading(false);
      return;
    }

    if (isSignUp && !name.trim()) {
      setError('Please enter your name.');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, {
          displayName: name
        });
        
        try {
          const newBusinessRef = doc(collection(db, 'businesses'));
          const generatedBusinessId = newBusinessRef.id;

          await setDoc(newBusinessRef, {
            businessId: generatedBusinessId,
            businessName: `${name || 'New'}'s Business`,
            createdAt: new Date().toISOString(),
            ownerId: user.uid
          });

          await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: user.email,
            role: role,
            businessId: generatedBusinessId,
            createdAt: serverTimestamp(),
          });
        } catch (firestoreErr) {
          handleFirestoreError(firestoreErr, OperationType.WRITE, `users/${user.uid}`);
        }
        
        // Send email verification
        await sendEmailVerification(user);
        await signOut(auth); // Sign out so they have to log in after verifying
        setSuccessMessage('Account created! Please check your email to verify your account before logging in.');
        setIsSignUp(false);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
          await signOut(auth);
          alert("Verify your email first.");
          setError('Please verify your email address before logging in. Check your inbox.');
          setIsLoading(false);
          return;
        }

        await resetFailedLoginAttempts(cleanEmail);
        
        let targetRole = role;
        let businessId = 'default_business';
        try {
          const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role) {
              targetRole = data.role;
            }
            if (data.businessId && data.businessId !== 'default_business') {
              businessId = data.businessId;
            } else {
              const { query, collection, where, getDocs } = await import('firebase/firestore');
              const q = query(collection(db, "businesses"), where("ownerId", "==", userCredential.user.uid));
              const qSnapshot = await getDocs(q);
              if (!qSnapshot.empty) {
                businessId = qSnapshot.docs[0].id;
              } else {
                const newRef = doc(collection(db, 'businesses'));
                businessId = newRef.id;
                await setDoc(newRef, {
                  businessId: businessId,
                  businessName: `${data.name || 'My'}'s Business`,
                  ownerId: userCredential.user.uid,
                  createdAt: new Date().toISOString()
                });
              }
              await setDoc(doc(db, 'users', userCredential.user.uid), { businessId }, { merge: true });
            }
          }
        } catch (firestoreErr) {
          console.error("Could not fetch user role", firestoreErr);
        }
        
        if (targetRole === 'owner') {
           localStorage.setItem('ownerId', userCredential.user.uid);
        }
        localStorage.setItem('businessId', businessId);
        
        redirectBasedOnRole(targetRole);
      }
    } catch (err: any) {
      await recordFailedLoginAttempt(cleanEmail);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Email or password is incorrect');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('User already exists. Please sign in');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection or disable ad blockers.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (typeof window === "undefined") return;

    if (isLoading) return;
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      
      let targetRole = role;
      let businessId = 'default_business';
      try {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          const newBusinessRef = doc(collection(db, 'businesses'));
          businessId = newBusinessRef.id;

          await setDoc(newBusinessRef, {
             businessId: businessId,
             businessName: `${result.user.displayName || 'New'}'s Business`,
             createdAt: new Date().toISOString(),
             ownerId: result.user.uid
          });

          await setDoc(doc(db, 'users', result.user.uid), {
            name: result.user.displayName || 'Unknown',
            email: result.user.email,
            role: role,
            businessId: businessId,
            createdAt: serverTimestamp(),
          });
        } else {
          const data = userDoc.data();
          if (data.role) {
            targetRole = data.role;
          }
          if (data.businessId && data.businessId !== 'default_business') {
            businessId = data.businessId;
          } else {
            const { query, collection, where, getDocs } = await import('firebase/firestore');
            const q = query(collection(db, "businesses"), where("ownerId", "==", result.user.uid));
            const qSnapshot = await getDocs(q);
            if (!qSnapshot.empty) {
              businessId = qSnapshot.docs[0].id;
            } else {
              const newRef = doc(collection(db, 'businesses'));
              businessId = newRef.id;
              await setDoc(newRef, {
                businessId: businessId,
                businessName: `${result.user.displayName || 'New'}'s Business`,
                createdAt: new Date().toISOString(),
                ownerId: result.user.uid
              });
            }
            await setDoc(doc(db, 'users', result.user.uid), { businessId }, { merge: true });
          }
        }
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.GET, `users/${result.user.uid}`);
      }
      
      if (targetRole === 'owner') {
         localStorage.setItem('ownerId', result.user.uid);
      }
      localStorage.setItem('businessId', businessId);
      
      redirectBasedOnRole(targetRole);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please enable it in the Firebase Console.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection or disable ad blockers.');
      } else if (err.message && err.message.includes('INTERNAL ASSERTION FAILED')) {
        setError('Sign-in was interrupted. Please try again and ensure popups are allowed.');
      } else {
        setError(err.message || 'An error occurred during Google authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const redirectBasedOnRole = (targetRole: string) => {
    const role = targetRole?.toLowerCase();

    if (role === 'owner') {
      localStorage.setItem('userRole', 'owner');
      router.push('/owner/dashboard');
      return;
    }
    if (role === 'manager') {
      localStorage.setItem('userRole', 'manager');
      router.push('/owner/dashboard');
      return;
    }
    if (role === 'staff') {
      localStorage.setItem('userRole', 'staff');
      router.push('/staff/dashboard');
      return;
    }

    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center border border-slate-100">
        <Image src="/logo.png" alt="JalSejiwan Logo" width={60} height={60} className="object-contain mb-5" referrerPolicy="no-referrer" />
        <h1 className="text-3xl font-bold text-blue-700 mb-1">JalSejiwan</h1>
        <p className="text-slate-500 mb-8 text-center">Smart Water Management</p>

        <div className="w-full mb-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Sign In As</label>
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => setRole('owner')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === 'owner' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <Store className="w-6 h-6 mb-2" />
              <span className="text-xs font-bold">OWNER</span>
            </button>
            <button 
              onClick={() => setRole('staff')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === 'staff' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <Truck className="w-6 h-6 mb-2" />
              <span className="text-xs font-bold">STAFF</span>
            </button>
            <button 
              onClick={() => setRole('manager')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === 'manager' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <Package className="w-6 h-6 mb-2" />
              <span className="text-xs font-bold">MANAGER</span>
            </button>
          </div>
        </div>

        {error && <div className="w-full mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
        {successMessage && <div className="w-full mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-xl border border-emerald-100">{successMessage}</div>}

        {role === 'owner' ? (
          <>
            {isSignUp && (
              <div className="w-full mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Name</label>
                <div className="flex bg-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 transition-all">
                  <span className="px-4 py-4 text-slate-500 flex items-center justify-center border-r border-slate-200">
                    <User className="w-5 h-5" />
                  </span>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    className="w-full bg-transparent px-4 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-400"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAuth(); }}
                  />
                </div>
              </div>
            )}

            <div className="w-full mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email</label>
              <div className="flex bg-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 transition-all">
                <span className="px-4 py-4 text-slate-500 flex items-center justify-center border-r border-slate-200">
                  <Mail className="w-5 h-5" />
                </span>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="w-full bg-transparent px-4 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAuth(); }}
                />
              </div>
            </div>

            <div className="w-full mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Password</label>
              <div className="flex bg-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 transition-all">
                <span className="px-4 py-4 text-slate-500 flex items-center justify-center border-r border-slate-200">
                  <Lock className="w-5 h-5" />
                </span>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-transparent px-4 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAuth(); }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-full mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Mobile Number or Email</label>
              <div className="flex bg-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 transition-all">
                <span className="px-4 py-4 text-slate-500 flex items-center justify-center border-r border-slate-200">
                  <User className="w-5 h-5" />
                </span>
                <input 
                  type="text" 
                  placeholder="Enter mobile or email" 
                  className="w-full bg-transparent px-4 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-400"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAuth(); }}
                />
              </div>
            </div>

            <div className="w-full mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Password</label>
              <div className="flex bg-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 transition-all">
                <span className="px-4 py-4 text-slate-500 flex items-center justify-center border-r border-slate-200">
                  <Lock className="w-5 h-5" />
                </span>
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full bg-transparent px-4 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-400 text-lg"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAuth(); }}
                />
              </div>
            </div>
          </>
        )}

        <button 
          onClick={handleAuth}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl active:scale-95 transition-all mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
        </button>

        {role === 'owner' && (
          <>
            <div className="w-full flex flex-col gap-3">
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>

            <p className="mt-8 text-sm text-slate-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"} <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 font-bold">{isSignUp ? 'Login' : 'Sign Up'}</button>
            </p>
          </>
        )}
        
        <div className="mt-8 pt-6 border-t border-slate-100 w-full text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operational Tooling V2.4.0</span>
        </div>
      </div>
    </div>
  );
}
