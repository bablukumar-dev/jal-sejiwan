'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Store, Truck, Package, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { getFirebase } from '@/src/lib/firebase';
import { getFriendlyAuthErrorMessage } from '@/lib/authHelper';
import { useAppContext } from '@/app/context/AppContext';
import { logActivity } from '@/lib/activityLogger';
import { Suspense } from 'react';

function SignupContent() {
  const router = useRouter();
  const { currentUser } = useAppContext();

  const [role, setRole] = useState<'owner' | 'staff' | 'manager'>('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Errors & Messages
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect logged-in users automatically
  useEffect(() => {
    if (currentUser && !isLoading) {
      const role = currentUser.role?.toLowerCase();
      if (role === 'staff') {
        router.replace('/staff/dashboard');
      } else if (role === 'manager') {
        router.replace('/manager/dashboard');
      } else if (role === 'owner') {
        router.replace('/owner/dashboard');
      }
    }
  }, [currentUser, router, isLoading]);

  const handleSignUp = async () => {
    if (role !== 'owner') {
      setError("Only owners can sign up directly. Staff and Managers must be added by their Owner.");
      return;
    }
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      const { auth, db } = getFirebase();
      if (!auth || !db) throw new Error("Firebase not initialized");

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create owner document
      const businessId = `biz_${Math.random().toString(36).substring(2, 11)}`;
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'owner',
        businessId: businessId,
        active: true,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Synchronously write to localStorage and context state to avoid race conditions
      localStorage.setItem('businessId', businessId);
      localStorage.setItem('userRole', 'owner');
      localStorage.setItem('ownerId', businessId);
      setCurrentUser({
        uid: user.uid,
        role: 'owner',
        businessId: businessId
      });

      logActivity({
        module: 'Authentication',
        action: 'Account Created',
        description: `New owner account created for ${email}`,
        status: 'success'
      });

      console.log("Success: User Logged In");
      router.replace('/owner/dashboard');
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code) {
        if (err.code === 'permission-denied') {
          setError("Firebase Permission Denied: Your Firestore security rules are blocking the account creation. Please ensure 'users' collection allows writes for authenticated users.");
        } else if (err.code === 'auth/unauthorized-domain') {
          setError("This domain is not authorized in Firebase Console. Please add 'ais-dev-4lwfomiixgmtpzlqyz5n6a-647035563969.asia-east1.run.app' to your Firebase Authentication domains.");
        } else {
          setError(getFriendlyAuthErrorMessage(err.code));
        }
      } else {
        setError("An unexpected error occurred during signup. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (strategy: "google") => {
    if (role !== 'owner') {
      setError("Only owners can use Google Login.");
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      const { auth, db } = getFirebase();
      if (!auth || !db) throw new Error("Firebase not initialized");

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      let businessId = '';
      if (!userDoc.exists()) {
        businessId = `biz_${Math.random().toString(36).substring(2, 11)}`;
        await setDoc(userDocRef, {
          email: user.email,
          role: 'owner',
          businessId: businessId,
          active: true,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } else {
        const data = userDoc.data();
        businessId = data.businessId || '';
      }

      // Synchronously write to localStorage and context state to avoid race conditions
      localStorage.setItem('businessId', businessId);
      localStorage.setItem('userRole', 'owner');
      localStorage.setItem('ownerId', businessId);
      setCurrentUser({
        uid: user.uid,
        role: 'owner',
        businessId: businessId
      });

      logActivity({
        module: 'Authentication',
        action: 'Account Created',
        description: `New owner account created for ${user.email} via Google`,
        status: 'success'
      });

      console.log("Success: User Logged In");
      router.replace('/owner/dashboard');
    } catch (err: any) {
      console.error("OAuth error:", err);
      if (err.code) {
        if (err.code === 'auth/unauthorized-domain') {
          setError("This domain is not authorized in Firebase Console. Please add 'ais-dev-4lwfomiixgmtpzlqyz5n6a-647035563969.asia-east1.run.app' to your Firebase Authentication domains.");
        } else {
          setError(getFriendlyAuthErrorMessage(err.code));
        }
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-10 flex flex-col items-center border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
        <Image src="/logo.png" alt="Logo" width={70} height={70} className="object-contain mb-6 drop-shadow-sm" referrerPolicy="no-referrer" />
        <h1 className="text-3xl font-bold text-blue-700 mb-1 font-sans tracking-tight">JalSejiwan</h1>
        <p className="text-slate-500 mb-10 text-center text-sm font-medium">Smart Water Management System</p>

        {/* Role Selector - Only Owner allowed for self-signup */}
        <div className="w-full mb-6">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Sign Up As</label>
          <div className="grid grid-cols-1">
            {[
              { id: 'owner', label: 'OWNER', icon: Store },
            ].map((r) => (
              <div 
                key={r.id}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
              >
                <r.icon className="w-6 h-6 mb-2 text-blue-600" />
                <span className="text-[10px] font-bold uppercase">{r.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-3 text-center italic">
            Staff and Manager accounts must be created by an Owner via the dashboard.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="w-full mb-6 p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="text-sm font-bold text-rose-900">Registration Issue</h3>
            </div>
            <p className="text-xs text-rose-700 font-medium leading-relaxed pl-5">
              {error}
            </p>
            <button 
              onClick={() => setError('')}
              className="mt-3 text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors pl-5"
            >
              Dismiss Notification
            </button>
          </div>
        )}
        
        {/* Dynamic Inputs */}
        <div className="w-full space-y-4 mb-6">
          <div className="animate-in fade-in duration-150">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Email Address</label>
            <div className="group flex bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all">
              <span className="px-4 py-4 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                <Mail className="w-5 h-5" />
              </span>
              <input 
                id="signup-email"
                type="email" 
                placeholder="name@example.com" 
                className="w-full bg-transparent px-2 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-300 font-sans"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              />
            </div>
            {emailError && (
              <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-in fade-in slide-in-from-top-1 font-sans">{emailError}</p>
            )}
          </div>

          <div className="animate-in fade-in duration-150">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Password</label>
            <div className="group flex bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all">
              <span className="px-4 py-4 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                <Lock className="w-5 h-5" />
              </span>
              <input 
                id="signup-password"
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                className="w-full bg-transparent px-2 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-300 font-sans"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-4 py-4 text-slate-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="animate-in fade-in duration-150">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Confirm Password</label>
            <div className="group flex bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all">
              <span className="px-4 py-4 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                <Lock className="w-5 h-5" />
              </span>
              <input 
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                className="w-full bg-transparent px-2 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-300 font-sans"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="px-4 py-4 text-slate-400 hover:text-blue-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-in fade-in slide-in-from-top-1 font-sans">{passwordError}</p>
            )}
          </div>
        </div>

        <button 
          id="signup-submit-btn"
          onClick={handleSignUp}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all mb-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 font-sans flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            'Sign Up'
          )}
        </button>

        {role === 'owner' && (
          <>
            <div className="w-full flex items-center gap-4 my-4">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">OR</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="w-full mt-4 space-y-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin("google")}
                disabled={isLoading}
                className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-slate-400">Connecting...</span>
                  </>
                ) : (
                  <>
                    <Image 
                      src="https://www.svgrepo.com/show/475656/google-color.svg" 
                      alt="Google" 
                      width={20}
                      height={20}
                      className="w-5 h-5" 
                    />
                    Continue with Google
                  </>
                )}
              </button>
            </div>
          </>
        )}

        <p className="text-sm text-slate-500 mt-6 text-center font-sans">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors">
            Login
          </Link>
        </p>

        <div className="mt-auto pt-8 w-full flex flex-col items-center gap-4">
          <div className="h-px w-full bg-slate-100" />
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] font-mono">Operational Tooling V2.5.0</p>
        </div>
      </div>
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
