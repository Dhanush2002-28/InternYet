import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../components/ProtectedRoute";

export default function NotFound() {
  const { user, profile } = useAuth();
  return (
    <div className="auth-wrap">
      <div className="auth-card center-card">
        <p className="code-big">404</p>
        <h1 className="auth-title">Page not found</h1>
        <p className="auth-sub">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="hero-actions center">
          {user && profile ? (
            <Link className="btn btn-primary" to={roleHome(profile.role)}>
              Go to my dashboard
            </Link>
          ) : (
            <Link className="btn btn-primary" to="/">Go to home</Link>
          )}
          <Link className="btn btn-ghost" to={user && profile ? "/" : "/login"}>
            {user && profile ? "Go to home" : "Sign in"}
          </Link>
        </div>
      </div>
    </div>
  );
}