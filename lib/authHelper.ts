import bcrypt from 'bcryptjs';

export const hashPin = (pin: string) => {
    return bcrypt.hashSync(pin, 8);
};

export const comparePin = (pin: string, hash: string) => {
    return bcrypt.compareSync(pin, hash);
};

export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to continue.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently unavailable.';
    case 'auth/account-exists-with-different-credential':
      return 'This email is already linked with another sign-in method.';
    default:
      return 'An unexpected authentication error occurred. Please try again.';
  }
}

export function setCookie(name: string, value: string, maxAgeSeconds?: number) {
  if (typeof document === 'undefined') return;
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; SameSite=Lax; Secure`;
  if (maxAgeSeconds !== undefined) {
    cookieString += `; max-age=${maxAgeSeconds}`;
  }
  document.cookie = cookieString;
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax; Secure`;
}
