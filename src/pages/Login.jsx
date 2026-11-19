import InstallAppPrompt from "../components/InstallAppPrompt";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canUseGoogle, isDemoMode, sendResetPasswordEmail, signInWithEmail, signInWithGoogle } from "../data/auth";
import { friendlyAuthError, isValidEmail } from "../utils/validators";
import { roleHome } from "../components/ProtectedRoute";

const DEMO_ACCOUNTS = [
  { label: "Student", email: "student@demo.com", password: "Student@1234" },
  { label: "Mentor", email: "mentor@demo.com", password: "Mentor@1234" },
  { label: "Admin", email: "admin@demo.com", password: "Admin@1234" }
];

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

export default function Login() {
  const { user, profile, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user && user.needsPasswordSetup) {
    return <Navigate to="/setup-password" replace />;
  }
  if (!loading && user && profile) return <Navigate to={roleHome(profile.role)} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  async function handleResetPassword() {
    setError("");
    setNotice("");
    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setError("Enter your email address, then choose Forgot password?");
      return;
    }
    setBusy(true);
    try {
      await sendResetPasswordEmail(normalizedEmail);
      setNotice(
        isDemoMode
          ? "Demo mode cannot send email. Use the demo password shown above."
          : "Password reset email sent. Check your inbox and spam folder."
      );
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
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
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your internship account.</p>

        {isDemoMode && (
          <div className="demo-creds">
            <p className="hint">Demo accounts (click to fill):</p>
            {DEMO_ACCOUNTS.map((account) => (
              <button
                type="button"
                key={account.email}
                className="demo-cred-row"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
              >
                <span className="demo-cred-role">{account.label}</span>
                <span className="demo-cred-email">{account.email}</span>
                <span className="hint">{account.password}</span>
              </button>
            ))}
          </div>
        )}

        {error && <div className="notice notice-error">{error}</div>}
        {notice && <div className="notice notice-success">{notice}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="button"
            className="forgot-password-link"
            onClick={handleResetPassword}
            disabled={busy}
          >
            Forgot password?
          </button>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {canUseGoogle ? (
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
        ) : (
          <p className="hint center">
            Google sign-in activates once Firebase is configured (see README).
          </p>
        )}

        <p className="auth-alt">
          New here? <Link to="/register">Create a student account</Link>
        </p>
      </div>
      </div>
    </div>
  );
}