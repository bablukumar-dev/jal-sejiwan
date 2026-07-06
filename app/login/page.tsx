'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, User, Store, Truck, Package, RefreshCw } from 'lucide-react';
import { supabase } from '@/src/supabaseClient';
import { getSupabaseAdmin } from '@/src/supabaseAdmin';
import { useAppContext } from '@/app/context/AppContext';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';


function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentUser, currentUser } = useAppContext();

  const [role, setRole] = useState<'owner' | 'staff' | 'manager'>('owner');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    
    if (r === 'owner' || r === 'manager') {
      router.replace('/owner/dashboard');
    } else if (r === 'staff') {
      router.replace('/staff/dashboard');
    } else {
      router.replace('/');
    }
  }, [router]);

  const checkRoleAndRedirect = useCallback(async (userId: string) => {
    try {
      console.log("--- Forensic Audit: Role Fetch Check ---");
      console.log("Checking role for user ID:", userId);
      
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      console.log("Supabase Audit Response:", { 
        hasData: !!userData, 
        role: userData?.role,
        error: fetchError 
      });

      if (fetchError || !userData) {
        console.log("User not found in database, checking for sync...");
        
        // If user not found, they might be the first user or just logged in.
        // Let's attempt to create them with 'owner' role if no users exist, or 'staff' otherwise
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const isFirstUser = count === 0;

        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: newUser, error: createError } = await getSupabaseAdmin()
          .from('users')
          .insert({
            id: userId,
            email: user?.email,
            name: user?.user_metadata?.name || 'New User',
            role: isFirstUser ? 'owner' : 'staff',
            business_id: isFirstUser ? userId : null,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error("User sync error detail:", JSON.stringify(createError, null, 2));
          setError(`Session finalization failed: ${createError.message || 'Unknown error'}`);
          setIsLoading(false);
          return;
        }

        console.log("New user synced successfully:", newUser);
        redirectBasedOnRole(newUser.role);
        return;
      }

      // If logging in via email/password, we check if role matches selection
      // If logging in via Google, we just follow the database role
      redirectBasedOnRole(userData.role);
    } catch (e) {
      console.error(e);
      setError("Login failed. Please refresh.");
      setIsLoading(false);
    }
  }, [redirectBasedOnRole, supabase]);

  useEffect(() => {
    // If already signed in, check role and redirect
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        checkRoleAndRedirect(session.user.id);
      }
    };
    checkSession();
  }, [checkRoleAndRedirect, supabase]);

  useEffect(() => {
    // Check if users table is empty to allow first owner signup
    const checkInitialSetup = async () => {
      try {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'owner');
        
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
    if (!email || !password) {
      setEmailError('Required');
      return;
    }

    setIsLoading(true);
    setError('');
    setEmailError('');

    try {
        // Login implementation for Supabase
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
        if (data.user) {
          await checkRoleAndRedirect(data.user.id);
        }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (strategy: "google") => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: strategy,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
