import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FullPageLoader } from "../components/FullPageLoader";
import { roleHome } from "../components/ProtectedRoute";

export default function Forbidden() {
  const { user, profile, loading } = useAuth();
  if (loading) return <FullPageLoader label="Checking access…" />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="auth-wrap">
      <div className="auth-card center-card">
        <p className="code-big">403</p>
        <h1 className="auth-title">Access restricted</h1>
        <p className="auth-sub">
          Your account does not have permission to view this page. Try heading back to your own
          dashboard.
        </p>
        <div className="hero-actions center">
          <Link className="btn btn-primary" to={roleHome(profile?.role)}>
            Go to my dashboard
          </Link>
          <Link className="btn btn-ghost" to="/">Go to home</Link>
        </div>
      </div>
    </div>
  );
}