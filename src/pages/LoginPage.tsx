import {
  ArrowRight,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthScreen } from "../components/auth/AuthScreen";
import { useAuth } from "../features/auth/AuthProvider";
import { ApiError } from "../lib/api/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname || "/";
  }, [location.state]);
  const flashMessage = useMemo(() => {
    const state = location.state as { message?: string } | null;
    return state?.message || "";
  }, [location.state]);

  if (status === "loading") {
    return (
      <AuthScreen
        title="Preparing sign-in"
        message="Checking your session before showing the login form."
      />
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    void (async () => {
      try {
        await login(formData);
        navigate(redirectTo, { replace: true });
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(
            "Unable to complete login right now. Please try again.",
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10 text-slate-900">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(233,243,250,0.96))] shadow-[0_35px_100px_rgba(41,73,104,0.12)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-slate-200/80 px-6 py-8 lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
          <p className="section-label">Authentication</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[0.03em] text-slate-900">
            Secure staff access for IBMS
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Sign in with your staff account to access the protected workspace.
            The app handles secure session setup and restores your profile
            automatically.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/78 p-5">
              <ShieldCheck className="h-6 w-6 text-sky-700" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                CSRF-aware login
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The frontend requests a CSRF token before login and updates it
                again when the backend rotates it.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/78 p-5">
              <LockKeyhole className="h-6 w-6 text-sky-700" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                Protected access
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Dashboard routes stay locked until a valid profile is restored
                from the backend session.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 lg:px-8 lg:py-10">
          <div className="relative rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-6 shadow-[0_18px_40px_rgba(18,38,58,0.08)]">
            {isSubmitting ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.5rem] bg-white/78 backdrop-blur-[2px]">
                <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 shadow-[0_18px_40px_rgba(14,116,144,0.12)]">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Signing you in and preparing your dashboard...
                </div>
              </div>
            ) : null}
            <p className="section-label">Login Form</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in with the staff account created through the backend admin
              user flow.
            </p>

            {flashMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {flashMessage}
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  autoComplete="email"
                  className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
                  type="email"
                  placeholder="admin@ibms.local"
                  value={formData.email}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Password
                </span>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,#1f87ad,#0f6d8d)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(32,141,183,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Continue to dashboard
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
