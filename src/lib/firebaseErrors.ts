/**
 * Maps Firebase Auth error codes to clear, user-friendly messages.
 * Technical details are kept out of the UI and should be console.error'd instead.
 */
export function getFirebaseErrorMessage(error: any): string {
  const code: string = error?.code || '';

  switch (code) {
    // --- Authentication ---
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'The password you entered is incorrect. Please try again.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please check and try again, or sign up.';
    case 'auth/invalid-email':
      return 'The email address you entered is not valid. Please check and try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Please sign in or use a different email.';
    case 'auth/weak-password':
      return 'Your password is too weak. Please use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes before trying again, or reset your password.';
    case 'auth/user-disabled':
      return 'Your account has been disabled. Please contact the hospital for assistance.';
    case 'auth/network-request-failed':
      return 'A network error occurred. Please check your internet connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/requires-recent-login':
      return 'For security, please sign in again before making this change.';
    case 'auth/expired-action-code':
      return 'This link has expired. Please request a new password reset email.';
    case 'auth/invalid-action-code':
      return 'This link is invalid or has already been used. Please request a new one.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    case 'auth/credential-already-in-use':
      return 'This credential is already linked to a different account.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/missing-password':
      return 'Please enter your password.';

    // --- Firestore / general ---
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'You do not have permission to perform this action. Please contact the hospital.';
    case 'not-found':
    case 'firestore/not-found':
      return 'The requested information could not be found. Please try again.';
    case 'unavailable':
    case 'firestore/unavailable':
      return 'The service is temporarily unavailable. Please check your connection and try again.';

    default:
      // If the message is a raw Firebase technical string (e.g. starts with 'Firebase:'),
      // replace it with a generic message so users never see internal SDK text.
      if (error?.message && !error.message.startsWith('Firebase:')) {
        return error.message;
      }
      return 'Something went wrong. Please try again or contact support if the issue persists.';
  }
}
