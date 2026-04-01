import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  clearStoredCsrfToken,
  fetchProfile,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
} from "../../lib/api/auth";
import type { AuthUser, LoginPayload } from "../../types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuthUser: (user: AuthUser) => void;
  expireSession: () => void;
};

const AUTH_REFRESH_INTERVAL_MS = 25 * 60 * 1000;
const FOCUS_REFRESH_COOLDOWN_MS = 60 * 1000;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function restoreUserSession() {
  try {
    return await fetchProfile();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const nextUser = await restoreUserSession();

        if (!isMounted) {
          return;
        }

        setUser(nextUser);
        setStatus(nextUser ? "authenticated" : "unauthenticated");

        if (nextUser) {
          lastRefreshAtRef.current = Date.now();
        }
      } catch {
        if (!isMounted) {
          return;
        }

        clearStoredCsrfToken();
        setUser(null);
        setStatus("unauthenticated");
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let isCancelled = false;

    const runSilentRefresh = async () => {
      try {
        await refreshSession();
        lastRefreshAtRef.current = Date.now();
      } catch {
        if (isCancelled) {
          return;
        }

        clearStoredCsrfToken();
        setUser(null);
        setStatus("unauthenticated");
      }
    };

    const refreshOnFocus = () => {
      const now = Date.now();
      const shouldSkip =
        document.visibilityState !== "visible" ||
        now - lastRefreshAtRef.current < FOCUS_REFRESH_COOLDOWN_MS;

      if (shouldSkip) {
        return;
      }

      void runSilentRefresh();
    };

    const intervalId = window.setInterval(() => {
      void runSilentRefresh();
    }, AUTH_REFRESH_INTERVAL_MS);

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [status]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      login: async (payload) => {
        const nextUser = await loginRequest(payload);
        setUser(nextUser);
        setStatus("authenticated");
        lastRefreshAtRef.current = Date.now();
      },
      logout: async () => {
        try {
          await logoutRequest();
        } finally {
          clearStoredCsrfToken();
          setUser(null);
          setStatus("unauthenticated");
        }
      },
      refreshUser: async () => {
        setStatus((currentStatus) =>
          currentStatus === "authenticated" ? "loading" : currentStatus,
        );

        try {
          const nextUser = await restoreUserSession();
          setUser(nextUser);
          setStatus(nextUser ? "authenticated" : "unauthenticated");

          if (nextUser) {
            lastRefreshAtRef.current = Date.now();
          }
        } catch {
          clearStoredCsrfToken();
          setUser(null);
          setStatus("unauthenticated");
        }
      },
      setAuthUser: (nextUser) => {
        setUser(nextUser);
        setStatus("authenticated");
        lastRefreshAtRef.current = Date.now();
      },
      expireSession: () => {
        clearStoredCsrfToken();
        setUser(null);
        setStatus("unauthenticated");
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
