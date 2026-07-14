import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getUniqueId = () => {
  return String(Date.now() + Math.floor(Math.random() * 1000));
};

export const safeGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const PUBLIC_PATHS = [
  '/login', 
  '/signup', 
  '/', 
  '/about', 
  '/contact', 
  '/privacy', 
  '/privacy-policy',
  '/terms', 
  '/terms-and-conditions',
  '/unauthorized'
];

export function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return PUBLIC_PATHS.includes(pathname) || 
         pathname.startsWith('/login') || 
         pathname.startsWith('/signup') ||
         pathname === '/unauthorized';
}

export function getSafeNumber(val: any, fallback = 0): number {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : val;
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  if (typeof val === 'object') {
    if ('value' in val && typeof val.value === 'number') {
      return val.value;
    }
    if ('Pr' in val && typeof val.Pr === 'number') {
      return val.Pr;
    }
    if ('operand' in val && typeof val.operand === 'number') {
      return val.operand;
    }
    if ('_type' in val && val._type === 'increment' && typeof val.value === 'number') {
      return val.value;
    }
  }
  return fallback;
}
