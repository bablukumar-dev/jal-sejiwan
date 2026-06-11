'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const publicPaths = ['/login', '/'];

const safeGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(!publicPaths.includes(pathname));

  useEffect(() => {
    if (publicPaths.includes(pathname)) {
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Check if there is a local non-Firebase session (PIN login for staff/manager)
        const localRole = safeGet('userRole');
        const localPinLogin = safeGet('pinAuth');
        const staffPhone = safeGet('staffPhone');
        
        if (localPinLogin === 'true' && (localRole === 'staff' || localRole === 'manager') && staffPhone) {
          try {
            const staffRef = doc(db, 'staff_users', staffPhone);
            const staffSnap = await getDoc(staffRef);
            
            if (staffSnap.exists()) {
              const sData = staffSnap.data();
              if (!sData.active) {
                // Account is disabled/inactive
                if (typeof window !== 'undefined') {
                  localStorage.clear();
                }
                router.replace('/login');
                return;
              }

              const realBusinessId = sData.businessId;
              if (!realBusinessId) {
                if (typeof window !== 'undefined') {
                  localStorage.clear();
                }
                router.replace('/login');
                return;
              }

              // Enforce match, block/prevent localStorage tampering
              const cachedBusinessId = safeGet('businessId');
              if (cachedBusinessId !== realBusinessId) {
                console.warn("BusinessId mismatch/tampering detected. Overriding with authenticated businessId.");
                if (typeof window !== 'undefined') {
                  localStorage.setItem('businessId', realBusinessId);
                  localStorage.setItem('ownerId', sData.ownerId || '');
                }
              }
              
              if (localRole === 'staff' && pathname.startsWith('/owner') && !pathname.includes('/owner/customers/add')) {
                router.replace('/staff/dashboard');
              } else if (localRole === 'staff' && pathname.startsWith('/inventory')) {
                router.replace('/staff/dashboard');
              } else {
                setLoading(false);
              }
            } else {
              // Staff account does not exist in DB
              if (typeof window !== 'undefined') {
                localStorage.clear();
              }
              router.replace('/login');
            }
          } catch (e) {
            console.error("Secure staff session validation failed", e);
            router.replace('/login');
          }
        } else {
          // Not logged in and not on a public path
          if (typeof window !== 'undefined') {
            localStorage.clear();
          }
          router.push('/login');
        }
      } else {
        // Enforce role-based routing for authenticated owners
        let targetRole = safeGet('userRole');
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const firestoreRole = data.role?.toLowerCase();
            
            if (firestoreRole) {
              if (targetRole && targetRole !== firestoreRole) {
                router.push('/login');
                return;
              }
              targetRole = firestoreRole;
            }
            
            // Reconcile and resolve precise businessId
            let realBusinessId = data.businessId;
            const isDefaultOwnerCandidate = user.uid === 'XSMGdqKBOIVTwFG4LnK1BitrEOp1'; // Chandani
            
            if (!realBusinessId || (realBusinessId === 'default_business' && !isDefaultOwnerCandidate)) {
              const { setDoc, query, collection, where, getDocs } = await import('firebase/firestore');
              const q = query(collection(db, "businesses"), where("ownerId", "==", user.uid));
              const qSnapshot = await getDocs(q);
              let resolvedBusinessId = '';
              if (!qSnapshot.empty) {
                resolvedBusinessId = qSnapshot.docs[0].id;
              } else {
                const newRef = doc(collection(db, 'businesses'));
                resolvedBusinessId = newRef.id;
                await setDoc(newRef, {
                  businessId: resolvedBusinessId,
                  businessName: `${data.name || 'My'}'s Business`,
                  ownerId: user.uid,
                  createdAt: new Date().toISOString()
                });
              }
              await setDoc(doc(db, 'users', user.uid), { businessId: resolvedBusinessId }, { merge: true });
              realBusinessId = resolvedBusinessId;
            }

            // Enforce match, block/prevent localStorage tampering
            const cachedBusinessId = safeGet('businessId');
            if (cachedBusinessId !== realBusinessId) {
              console.warn("BusinessId mismatch/tampering detected. Overriding with authenticated businessId.");
              if (typeof window !== 'undefined') {
                localStorage.setItem('businessId', realBusinessId);
                localStorage.setItem('ownerId', user.uid);
              }
            }
            
            // Create default business document if user is default owner and it does not exist
            if (targetRole === 'owner' && isDefaultOwnerCandidate) {
               const { setDoc } = await import('firebase/firestore');
               const businessDoc = await getDoc(doc(db, 'businesses', 'default_business'));
               if (!businessDoc.exists()) {
                 await setDoc(doc(db, 'businesses', 'default_business'), {
                   businessId: 'default_business',
                   businessName: 'Default Business',
                   createdAt: new Date().toISOString(),
                   ownerId: user.uid
                 }, { merge: true });
               }
            }
          } else {
            // User entry missing in Firestore users collection
            await auth.signOut();
            if (typeof window !== 'undefined') {
              localStorage.clear();
            }
            router.push('/login');
            return;
          }
        } catch (e) {
          console.error("Could not verify role or validate owner session", e);
        }

        if (targetRole === 'staff' && pathname.startsWith('/owner') && !pathname.includes('/owner/customers/add')) {
          router.replace('/staff/dashboard');
        } else if (targetRole === 'staff' && pathname.startsWith('/inventory')) {
          router.replace('/staff/dashboard');
        } else {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    const publicPaths = ['/login', '/'];
    if (!publicPaths.includes(pathname)) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Checking session...</div>;
    }
  }

  return <>{children}</>;
}
