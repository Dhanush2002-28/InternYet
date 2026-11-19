import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  updateProfile as firebaseUpdateProfile,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseConfigured } from "../firebase/app";
import * as demo from "./demo";

export const isDemoMode = !isFirebaseConfigured;
export const canUseGoogle = isFirebaseConfigured;

function publicUser(firebaseUser) {
  const hasPasswordProvider = firebaseUser.providerData.some(
    (provider) => provider.providerId === "password"
  );
  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || "",
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || null,
    needsPasswordSetup: !isDemoMode && !hasPasswordProvider
  };
}

export async function onAuthChange(callback) {
  if (isDemoMode) {
    await demo.demoSeed();
    demo.demoOnSession((user) => callback(user));
    callback(demo.demoCurrentUser());
    return () => demo.demoOnSession(null);
  }
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      await ensureProfile(user);
    } catch (err) {
      console.error("Failed to ensure profile:", err);
    }
    callback(publicUser(user));
  });
}

async function resolveRole(email) {
  if (!isFirebaseConfigured || !email) return "student";
  const [adminSnap, mentorSnap] = await Promise.allSettled([
    getDoc(doc(db, "adminAllowlist", email)),
    getDoc(doc(db, "approvedMentors", email))
  ]);
  if (adminSnap.status === "fulfilled" && adminSnap.value.exists()) return "admin";
  if (mentorSnap.status === "fulfilled" && mentorSnap.value.exists()) return "mentor";
  return "student";
}

async function ensureProfile(firebaseUser, extra = {}) {
  if (!isFirebaseConfigured) return;
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const role = await resolveRole(firebaseUser.email);
    const base = {
      uid: firebaseUser.uid,
      role,
      name: firebaseUser.displayName || extra.name || "",
      email: firebaseUser.email || "",
      phone: "",
      photoURL: firebaseUser.photoURL || null,
      createdAt: new Date().toISOString()
    };
    if (role === "student") {
      base.offerLetter = null;
      base.internship = { status: "registered" };
    }
    await setDoc(ref, base);
  } else {
    const data = snap.data();
    const patch = {};
    if (!data.name && (firebaseUser.displayName || extra.name)) {
      patch.name = firebaseUser.displayName || extra.name;
    }
    if (!data.photoURL && firebaseUser.photoURL) patch.photoURL = firebaseUser.photoURL;
    if (Object.keys(patch).length > 0) await updateDoc(ref, patch);
  }
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  await ensureProfile(credential.user);
  return publicUser(credential.user);
}

export async function signInWithEmail(email, password) {
  if (isDemoMode) {
    const user = await demo.demoSignIn({ email, password });
    demo.demoEmitSession();
    return user;
  }
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureProfile(credential.user);
  return publicUser(credential.user);
}

export async function signUpWithEmail({ name, email, password }) {
  if (isDemoMode) {
    const user = await demo.demoSignUp({ name, email, password, role: "student" });
    demo.demoEmitSession();
    return user;
  }
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await firebaseUpdateProfile(credential.user, { displayName: name });
  await ensureProfile(credential.user, { name });
  return publicUser(credential.user);
}

export async function setPasswordForCurrentUser(password) {
  if (isDemoMode || !auth?.currentUser?.email) return;
  const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
  await linkWithCredential(auth.currentUser, credential);
  await auth.currentUser.reload();
}

export async function signOutUser() {
  if (isDemoMode) {
    demo.demoSignOut();
    demo.demoEmitSession();
    return;
  }
  await signOut(auth);
}