import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FullPageLoader } from "./FullPageLoader";
import { roleHome } from "./ProtectedRoute";

export default function RoleRedirect() {
  const { user, profile, loading } = useAuth();
  if (loading) return <FullPageLoader label="Redirecting…" />;
  if (!user || !profile) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome(profile.role)} replace />;
}