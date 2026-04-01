import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { AuthScreen } from "./AuthScreen";

export function PublicOnlyRoute() {
  const { isAuthenticated, status } = useAuth();

  if (status === "loading") {
    return (
      <AuthScreen
        title="Preparing login"
        message="Checking whether you already have an active session before showing the sign-in form."
      />
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
