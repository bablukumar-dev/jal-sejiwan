'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, Store, Truck, Package, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getFriendlyAuthErrorMessage } from '@/lib/authHelper';


function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentUser, currentUser } = useAppContext();
  const [role, setRole] = useState<'owner' | 'staff' | 'manager'>('owner');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');

  // App State
  const [isUsersTableEmpty, setIsUsersTableEmpty] = useState<boolean>(false);

  // Errors & Messages
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async () => {
    setError('');
    setIsLoading(true);
    console.log("Authenticating...");
    try {
      const { signInWithEmailAndPassword, signOut } = await import('firebase/auth');
      const { doc, getDoc } = await import('firebase/firestore');
      const { getFirebase } = await import('@/src/lib/firebase');
      const { auth, db } = getFirebase();
      if (!auth || !db) throw new Error("Firebase not initialized");

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role.toLowerCase() !== role) {
              console.log("Error: Unauthorized role access.");
              await signOut(auth);
              setError(`This account is not authorized as ${role}.`);
              setIsLoading(false);
              return;
          }
          console.log("Success: User Logged In");
      } else {
          console.log("Error: User not found in database.");
          await signOut(auth);
          setError("User not found in database.");
          setIsLoading(false);
          return;
      }
      
      router.replace(role === 'staff' ? '/staff/dashboard' : '/owner/dashboard');
    } catch (err: any) {
      console.log(`Error: ${err.message || 'Login failed.'}`);
      if (err.code) {
        if (err.code === 'permission-denied') {
          setError("Firebase Permission Denied: Unable to read user profile. Please check your Firestore security rules.");
        } else {
          setError(getFriendlyAuthErrorMessage(err.code));
        }
      } else {
        setError("Login failed. Please check your credentials and try again.");
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
    console.log("Authenticating...");
    try {
      const { signInWithPopup, GoogleAuthProvider, signOut } = await import('firebase/auth');
      const { doc, getDoc } = await import('firebase/firestore');
      const { getFirebase } = await import('@/src/lib/firebase');
      const { auth, db } = getFirebase();
      if (!auth || !db) throw new Error("Firebase not initialized");
      
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      // Verify if the user exists as an OWNER in Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role.toLowerCase() !== 'owner') {
              console.log("Error: Unauthorized role access.");
              await signOut(auth);
              setError("Unauthorized role access. Only owners can use Google Login.");
              setIsLoading(false);
              return;
          }
          console.log("Success: User Logged In");
      } else {
          // If the user doesn't exist, we might need to handle automatic OWNER creation or 
          // strict invitation-only login. Assuming strict lookup based on instructions.
          console.log("Error: User not found in database.");
          await signOut(auth);
          setError("User not found in database.");
          setIsLoading(false);
          return;
      }
      
      router.replace('/owner/dashboard');
    } catch (err: any) {
       console.log(`Error: ${err.message || 'Google login failed.'}`);
       if (err.code) {
         if (err.code === 'permission-denied') {
           setError("Firebase Permission Denied: Unable to read user profile after Google login. Please check your Firestore security rules.");
         } else if (err.code === 'auth/unauthorized-domain') {
           setError("This domain is not authorized in Firebase Console. Please add 'ais-dev-4lwfomiixgmtpzlqyz5n6a-647035563969.asia-east1.run.app' to your Firebase Authentication domains.");
         } else {
           setError(getFriendlyAuthErrorMessage(err.code));
         }
       } else {
         setError("Google login failed. Please try again.");
       }
       setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    // Verification logic not needed for password sign up, or implement email confirmation check
    router.push('/owner/dashboard');
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Verify your email</h2>
          <p className="text-slate-500 text-sm text-center mb-6">Enter the code sent to {email}</p>
          <input
            type="text"
            placeholder="Verification code"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono outline-none focus:ring-2 focus:ring-blue-600 mb-6"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            onClick={handleVerification}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Complete Signup'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-10 flex flex-col items-center border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
        <Image src="/logo.png" alt="Logo" width={70} height={70} className="object-contain mb-6 drop-shadow-sm" referrerPolicy="no-referrer" />
        <h1 className="text-3xl font-bold text-blue-700 mb-1 font-sans tracking-tight">JalSejiwan</h1>
        <p className="text-slate-500 mb-10 text-center text-sm font-medium">Smart Water Management System</p>

        {/* Role Selector */}
        <div className="w-full mb-6">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Sign In As</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'owner', label: 'OWNER', icon: Store },
              { id: 'staff', label: 'STAFF', icon: Truck },
              { id: 'manager', label: 'MANAGER', icon: Package },
            ].map((r) => (
              <button 
                key={r.id}
                id={`role-btn-${r.id}`}
                onClick={() => setRole(r.id as any)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${role === r.id ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'}`}
              >
                <r.icon className={`w-6 h-6 mb-2 ${role === r.id ? 'text-blue-600' : 'text-slate-300'}`} />
                <span className="text-[10px] font-bold uppercase">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="w-full mb-6 p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="text-sm font-bold text-rose-900">Authentication Issue</h3>
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
                id="login-email"
                type="email" 
                placeholder="name@example.com" 
                className="w-full bg-transparent px-2 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-300 font-sans"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
              />
            </div>
          </div>
          <div className="animate-in fade-in duration-150">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Password</label>
            <div className="group flex bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all">
              <span className="px-4 py-4 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                <Lock className="w-5 h-5" />
              </span>
              <input 
                id="login-password"
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                className="w-full bg-transparent px-2 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-300 font-sans"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setEmailError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
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
          {emailError && (
            <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-in fade-in slide-in-from-top-1 font-sans">{emailError}</p>
          )}
        </div>

        <button 
          id="auth-submit-btn"
          onClick={handleEmailAuth}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all mb-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 font-sans flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            'Login to Dashboard'
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
                onClick={() => handleOAuthLogin("google")}
                className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm text-sm"
              >
                <Image 
                  src="https://www.svgrepo.com/show/475656/google-color.svg" 
                  alt="Google" 
                  width={20}
                  height={20}
                  className="w-5 h-5" 
                />
                Continue with Google
              </button>
            </div>
          </>
        )}

        {role === 'owner' && isUsersTableEmpty === false && (
          <p className="text-xs text-slate-400 mt-4 text-center">
            Public registration is disabled. Only the owner can create new staff or manager accounts from their dashboard.
          </p>
        )}

        <p className="text-sm text-slate-500 mt-6 text-center font-sans">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors">
            Sign Up
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

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
