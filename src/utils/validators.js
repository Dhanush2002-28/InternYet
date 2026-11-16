export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function isNonEmpty(value) {
  return Boolean(value && String(value).trim().length > 0);
}

export function isHttpsUrl(value) {
  const v = String(value || "").trim();
  if (!/^https:\/\/[^\s]+\.[^\s]+/.test(v)) return false;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

export function friendlyAuthError(error) {
  if (error instanceof Error && !error.code) return error.message;
  const code = error?.code || error?.message || "";
  const map = {
    "auth/popup-closed-by-user": "Sign-in was cancelled before completing.",
    "auth/cancelled-popup-request": "Sign-in was cancelled before completing.",
    "auth/popup-hidden-by-user": "The sign-in popup was blocked. Allow pop-ups for this site and try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/wrong-password": "Invalid email or password.",
    "auth/user-not-found": "Invalid email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
    "auth/weak-password": "Password must be at least 8 characters long.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase. See the README for setup steps."
  };
  return map[code] || "Something went wrong. Please try again.";
}