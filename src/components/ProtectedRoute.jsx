import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FullPageLoader } from "./FullPageLoader";

export function roleHome(role) {
  if (role === "mentor") return "/mentor";
  if (role === "admin") return "/admin";
  return "/student";
}

export default function ProtectedRoute({ roles, children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user.needsPasswordSetup) return <Navigate to="/setup-password" replace />;
  if (!profile) return <FullPageLoader label="Loading your profile…" />;
  if (roles && !roles.includes(profile.role)) return <Navigate to="/forbidden" replace />;
  return children ? <>{children}</> : <Outlet />;
}