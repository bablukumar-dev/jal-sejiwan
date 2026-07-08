import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
