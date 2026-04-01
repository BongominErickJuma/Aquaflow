import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { AuthScreen } from "./AuthScreen";

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, status } = useAuth();

  if (status === "loading") {
    return (
      <AuthScreen
        title="Restoring secure session"
        message="Checking your account profile, cookies, and CSRF state before loading the dashboard."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
