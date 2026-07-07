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
      return 'This email is already registered. Please sign in or use another email.';
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
      return 'Network connection lost. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
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
