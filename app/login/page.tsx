'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, User, Store, Truck, Package } from 'lucide-react';
import { supabase } from '@/src/supabaseClient';
import { useAppContext } from '@/app/context/AppContext';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { useSignIn, useSignUp, useAuth } from '@clerk/nextjs';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentUser, currentUser } = useAppContext();

  const hasClerkKey = typeof window !== 'undefined' ? !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY : false;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerkSignIn = hasClerkKey ? useSignIn() : { isLoaded: true, signIn: null, setActive: null };
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerkSignUp = hasClerkKey ? useSignUp() : { isLoaded: true, signUp: null, setActive: null };
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerkAuth = hasClerkKey ? useAuth() : { isLoaded: true, isSignedIn: false, userId: null };

  const isSignInLoaded = clerkSignIn.isLoaded;
  const signIn = clerkSignIn.signIn;
  const setSignInActive = clerkSignIn.setActive;

  const isSignUpLoaded = clerkSignUp.isLoaded;
  const signUp = clerkSignUp.signUp;
  const setSignUpActive = clerkSignUp.setActive;

  const isSignedIn = clerkAuth.isSignedIn;
  const userId = clerkAuth.userId;
  
  const [role, setRole] = useState<'owner' | 'staff' | 'manager'>('owner');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(() => searchParams.get('signup') === 'true');
  const [name, setName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');

  // App State
  const [isUsersTableEmpty, setIsUsersTableEmpty] = useState<boolean | null>(null);

  // Errors & Messages
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectBasedOnRole = useCallback((targetRole: string) => {
    const r = targetRole?.toLowerCase();
    localStorage.setItem('userRole', r);
    
    if (r === 'owner') {
      router.push('/owner/dashboard');
    } else if (r === 'manager') {
      router.push('/manager/dashboard');
    } else if (r === 'staff') {
      router.push('/staff/dashboard');
    } else {
      router.push('/');
    }
  }, [router]);

  const checkRoleAndRedirect = useCallback(async (userId: string) => {
    try {
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !userData) {
        console.error("User fetch error:", fetchError);
        setError("User not found in database. Please contact the owner.");
        return;
      }

      // If logging in via email/password, we check if role matches selection
      // If logging in via Google, we just follow the database role
      redirectBasedOnRole(userData.role);
    } catch (e) {
      console.error(e);
      setError("Error checking user role");
    }
  }, [redirectBasedOnRole]);

  useEffect(() => {
    // If already signed in, check role and redirect
    if (isSignedIn && userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      checkRoleAndRedirect(userId);
    }
  }, [isSignedIn, userId, checkRoleAndRedirect]);

  useEffect(() => {
    // Check if users table is empty to allow first owner signup
    const checkInitialSetup = async () => {
      try {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          setIsUsersTableEmpty(count === 0);
        }
      } catch (err) {
        console.error("Error checking initial setup:", err);
      }
    };
    
    checkInitialSetup();
  }, []);

  const handleEmailAuth = async () => {
    if (!hasClerkKey) {
      setError("Clerk is not configured. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable.");
      return;
    }
    if (!isSignInLoaded || !isSignUpLoaded) {
      setError("Authentication system is loading... Please try again in a few seconds.");
      return;
    }
    if (!email || !password) {
      setEmailError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    setEmailError('');

    try {
      if (isSignUp) {
        if (isUsersTableEmpty === false) {
          setEmailError('Public signup is disabled. Only the owner can create new accounts.');
          setIsLoading(false);
          return;
        }

        const result = await signUp.create({
          emailAddress: email.trim(),
          password,
        });

        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setVerifying(true);
      } else {
        const result = await signIn.create({
          identifier: email.trim(),
          password: password,
        });

        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          await checkRoleAndRedirect(result.createdUserId as string);
        } else {
          setError('Authentication failed. Please check your credentials.');
        }
      }
    } catch (err: any) {
      setEmailError(err.errors?.[0]?.message || err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!hasClerkKey) {
      setError("Clerk is not configured. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable.");
      return;
    }
    if (!isSignInLoaded) return;
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin.replace(/^http:/, 'https:') : '';
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${origin}/`,
        redirectUrlComplete: `${origin}/`,
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Google login failed');
    }
  };

  const handleVerification = async () => {
    if (!hasClerkKey) {
      setError("Clerk is not configured. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable.");
      return;
    }
    if (!isSignUpLoaded) return;
    setIsLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
        
        // Sync to Supabase as Owner
        if (isUsersTableEmpty) {
          const { error: insertError } = await supabase.from('users').insert({
            id: completeSignUp.createdUserId,
            email: email.trim(),
            name: name.trim() || 'Business Owner',
            role: 'owner',
            business_id: completeSignUp.createdUserId
          });
          
          if (insertError) {
            console.error("Supabase sync error:", insertError);
            throw insertError;
          }
          setIsUsersTableEmpty(false);
        }
        
        router.push('/owner/dashboard');
      } else {
        setError('Verification failed');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
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
        {!isSignUp && (
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
        )}

        {error && (
          <div className="w-full mb-4 p-4 bg-red-50 text-red-600 text-xs rounded-2xl border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}
        
        {/* Dynamic Inputs */}
        <div className="w-full space-y-4 mb-6">
          {isSignUp && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-150">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Full Name</label>
              <div className="group flex bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all">
                <span className="px-4 py-4 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                  <User className="w-5 h-5" />
                </span>
                <input 
                  id="signup-name"
                  type="text" 
                  placeholder="John Doe" 
                  className="w-full bg-transparent px-2 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-300 font-sans"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}
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
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-transparent px-2 py-4 outline-none font-medium text-slate-900 placeholder:text-slate-300 font-sans"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setEmailError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
              />
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all mb-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 font-sans"
        >
          {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>

        {!isSignUp && (
          <>
            <div className="w-full flex items-center gap-4 my-4">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">OR</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="w-full mt-4">
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Continue with Google
              </button>
            </div>
          </>
        )}

        {role === 'owner' && isUsersTableEmpty !== false && (
          <p className="text-sm text-slate-500 font-sans">
            {isSignUp ? 'Already have an account?' : "First time setting up?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)} 
              className="text-blue-600 font-bold hover:underline underline-offset-4"
            >
              {isSignUp ? 'Log In' : 'Register as Owner'}
            </button>
          </p>
        )}

        {role === 'owner' && isUsersTableEmpty === false && !isSignUp && (
          <p className="text-xs text-slate-400 mt-4 text-center">
            Public registration is disabled. Only the owner can create new staff or manager accounts from their dashboard.
          </p>
        )}

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
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Loading auth...</div>}>
      <LoginContent />
    </Suspense>
  );
}
