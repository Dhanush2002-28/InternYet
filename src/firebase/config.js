const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.VITE_FIREBASE_APP_ID || ""
};

function looksConfigured(config) {
  return (
    config.apiKey.startsWith("AIza") &&
    config.projectId.length > 0 &&
    config.appId.includes(":") &&
    config.authDomain.includes(".")
  );
}

export const isFirebaseConfigured = looksConfigured(firebaseConfig);

if (!isFirebaseConfigured && Object.values(firebaseConfig).some((value) => value.length > 0)) {
  console.warn(
    "[Internship Portal] Firebase env vars are present but incomplete or invalid. " +
      "Falling back to offline demo mode. Fill all VITE_FIREBASE_* values in .env (see .env.example) to go live."
  );
}

export default firebaseConfig;