import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canUseGoogle, isDemoMode, signInWithGoogle, signUpWithEmail } from "../data/auth";
import { getProfile } from "../data/store";
import { friendlyAuthError, isNonEmpty, isValidEmail } from "../utils/validators";
import { roleHome } from "../components/ProtectedRoute";
import { FullPageLoader } from "../components/FullPageLoader";
import InstallAppPrompt from "../components/InstallAppPrompt";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function Register() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading && user) return <FullPageLoader label="Redirecting…" />;
  if (!loading && user && profile) {
    if (profile.role === "student" && !profile.offerLetter) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <Navigate to={roleHome(profile.role)} replace />;
  }

  async function destinationFor(signedInUser) {
    const currentProfile = await getProfile(signedInUser.uid);
    if (currentProfile && currentProfile.offerLetter) {
      navigate(roleHome(currentProfile.role));
    } else {
      navigate("/complete-profile");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setDuplicateEmail(false);
    if (!isNonEmpty(name) || name.trim().length < 3) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const signedIn = await signUpWithEmail({ name: name.trim(), email: email.trim(), password });
      await destinationFor(signedIn);
    } catch (err) {
      setDuplicateEmail(err?.code === "auth/email-already-in-use");
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setBusy(true);
    try {
      const signedIn = await signInWithGoogle();
      await destinationFor(signedIn);
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-stack">
        <InstallAppPrompt />
        <Link to="/" className="auth-back">&larr; Back to home</Link>
      <div className="auth-card">
        <Link to="/" className="brand auth-brand">
          <span className="brand-mark">IP</span>
          <span className="brand-name">Internship Portal</span>
        </Link>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">
          Register as a student. Your offer letter is generated automatically after you complete
          your profile.
        </p>

        {error &&
          (duplicateEmail ? (
            <div className="notice notice-error">
              This email is already registered.{" "}
              <Link to="/login" className="notice-link">
                Sign in instead
              </Link>
            </div>
          ) : (
            <div className="notice notice-error">{error}</div>
          ))}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              className="input"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="hint">At least 8 characters. Stored securely by Firebase.</span>
          </div>
          <div className="field">
            <label htmlFor="reg-confirm">Confirm password</label>
            <input
              id="reg-confirm"
              className="input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        {canUseGoogle && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={handleGoogle}
              disabled={busy}
            >
              <GoogleIcon /> Continue with Google
            </button>
          </>
        )}

        <p className="auth-alt">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
        <p className="hint">
          Mentor and admin accounts are provisioned by the program administrator — students
          register here.
        </p>
        {isDemoMode && (
          <p className="hint">
            Demo mode: use the demo accounts on the sign-in page to explore the mentor and admin
            dashboards.
          </p>
        )}
      </div>
      </div>
    </div>
  );
}