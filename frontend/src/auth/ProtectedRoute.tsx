import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { HOME_BY_ROLE, Role } from "@/lib/roles";
import { Spinner } from "@/components/ui";

/** Route réservée aux utilisateurs connectés, éventuellement limitée à certains rôles (EF-03). */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="center-page"><Spinner dark /></div>;
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/acces-refuse" replace />;
  return <Outlet />;
}

/** Redirige un utilisateur déjà connecté hors des pages de connexion / inscription. */
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-page"><Spinner dark /></div>;
  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  return <Outlet />;
}
