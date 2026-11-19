import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../components/ProtectedRoute";
import { setPasswordForCurrentUser, signOutUser } from "../data/auth";
import { friendlyAuthError } from "../utils/validators";

export default function PasswordSetup() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.needsPasswordSetup && profile) {
    return <Navigate to={roleHome(profile.role)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await setPasswordForCurrentUser(password);
      window.location.reload();
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await signOutUser();
    navigate("/login", { replace: true });
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">IP</span>
          <span className="brand-name">Internship Portal</span>
        </div>
        <h1 className="auth-title">Create a password</h1>
        <p className="auth-sub">
          Add a password so you can also sign in with {user.email}.
        </p>
        {error && <div className="notice notice-error">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="password-setup-password">Password</label>
            <input
              id="password-setup-password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password-setup-confirmation">Confirm password</label>
            <input
              id="password-setup-confirmation"
              className="input"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              minLength={8}
              required
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? "Saving password…" : "Save password"}
          </button>
        </form>
        <button type="button" className="btn btn-ghost btn-block" onClick={handleSignOut} disabled={busy}>
          Sign out
        </button>
      </div>
    </div>
  );
}
