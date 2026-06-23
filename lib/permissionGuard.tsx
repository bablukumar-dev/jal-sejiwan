'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'owner' | 'manager' | 'staff';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 3,
  manager: 2,
  staff: 1,
};

export type Permission =
  | 'create_user'
  | 'delete_user'
  | 'reset_pin'
  | 'bulk_reminder'
  | 'remind_all_due'
  | 'monthly_auto_reminder'
  | 'financial_reports'
  | 'subscription_settings'
  | 'view_reports'
  | 'access_inventory'
  | 'access_user_management'
  | 'access_settings'
  | 'view_customers'
  | 'view_deliveries'
  | 'view_payments'
  | 'single_reminder';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'create_user',
    'delete_user',
    'reset_pin',
    'bulk_reminder',
    'remind_all_due',
    'monthly_auto_reminder',
    'financial_reports',
    'subscription_settings',
    'view_reports',
    'access_inventory',
    'access_user_management',
    'access_settings',
    'view_customers',
    'view_deliveries',
    'view_payments',
    'single_reminder',
  ],
  manager: [
    'view_customers',
    'view_deliveries',
    'view_payments',
    'access_inventory',
    'single_reminder',
    'view_reports', // Limited reports (frontend checks financial_reports permission as well)
    'access_settings',
  ],
  staff: [
    'single_reminder', // Optional single whatsapp reminder
  ],
};

/**
 * Checks if a role has a specific permission
 */
export function hasPermission(role: string | null, permission: Permission): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase() as UserRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Checks if a role meets a minimum required role in the hierarchy
 */
export function meetsRoleRequirement(userRole: string | null, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  const normUser = userRole.toLowerCase() as UserRole;
  const normReq = requiredRole.toLowerCase() as UserRole;
  
  const userLevel = ROLE_HIERARCHY[normUser] || 0;
  const reqLevel = ROLE_HIERARCHY[normReq] || 0;
  
  return userLevel >= reqLevel;
}

/**
 * Resolves current user role from client storage safely.
 */
export function getCurrentUserRole(): UserRole {
  if (typeof window === 'undefined') return 'staff';
  const role = localStorage.getItem('userRole');
  if (role === 'owner') return 'owner';
  if (role === 'manager') return 'manager';
  return 'staff';
}

/**
 * Resolves current user id from client storage.
 */
export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'unknown';
  const role = localStorage.getItem('userRole');
  if (role === 'owner') {
    return localStorage.getItem('ownerId') || 'owner';
  }
  return localStorage.getItem('staffUserId') || 'unknown';
}

/**
 * High-Order wrapper for React components to enforce authentication and/or role permissions.
 * Does not rename or alter existing route files.
 */
export function wrapRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: { requiredRole?: UserRole; requiredPermission?: Permission } = {}
) {
  return function GuardedComponent(props: P) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [verifiedRole, setVerifiedRole] = useState<UserRole | null>(null);

    useEffect(() => {
      if (typeof window === 'undefined') return;

      const role = getCurrentUserRole();
      setVerifiedRole(role);

      let isAllowed = true;

      if (options.requiredRole && !meetsRoleRequirement(role, options.requiredRole)) {
        isAllowed = false;
      }

      if (options.requiredPermission && !hasPermission(role, options.requiredPermission)) {
        isAllowed = false;
      }

      if (!isAllowed) {
        // Redirection logic matching JalSejiwan flow
        if (role === 'staff') {
          router.replace('/staff/dashboard');
        } else {
          router.replace('/login');
        }
      } else {
        setAuthorized(true);
      }
    }, [router]);

    if (!authorized) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <span className="animate-pulse block w-8 h-8 rounded-full bg-blue-600/20" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Verifying authorization...</h2>
          <p className="text-xs text-slate-400 mt-1">Please wait while we secure your session credentials.</p>
        </div>
      );
    }

    return React.createElement(Component, props);
  };
}
