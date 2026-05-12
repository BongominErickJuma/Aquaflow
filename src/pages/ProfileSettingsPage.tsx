import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ModuleTabs } from "../components/layout/ModuleTabs";
import { useAuth } from "../features/auth/AuthProvider";
import {
  ApiError,
  changePassword,
  resolveApiAssetUrl,
  updateProfile,
} from "../lib/api/auth";

type ProfileFormState = {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
};

type PasswordFormState = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

function formatJoinDate(value: string | undefined) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

const fieldClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300";

export function ProfileSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, setAuthUser } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, setIsPasswordPending] = useState(false);

  const tabs = [
    { id: "details", label: "Profile Details" },
    { id: "security", label: "Security" },
  ];

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      email: user.email ?? "",
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      phone_number: user.phone_number ?? "",
    });
  }, [user]);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedPhoto]);

  const profilePhotoUrl = useMemo(() => {
    if (photoPreviewUrl) return photoPreviewUrl;
    if (removePhoto) return null;
    return resolveApiAssetUrl(user?.profile_photo ?? null);
  }, [photoPreviewUrl, removePhoto, user?.profile_photo]);

  const initials = `${profileForm.first_name} ${profileForm.last_name}`
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedPhoto(nextFile);
    setRemovePhoto(false);
    setProfileMessage("");
    setProfileError("");
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");

    startProfileTransition(() => {
      void (async () => {
        try {
          const formData = new FormData();
          formData.append("email", profileForm.email.trim());
          formData.append("first_name", profileForm.first_name.trim());
          formData.append("last_name", profileForm.last_name.trim());
          formData.append("phone_number", profileForm.phone_number.trim());

          if (selectedPhoto) {
            formData.append("profile_photo", selectedPhoto);
          }

          if (removePhoto) {
            formData.append("remove_profile_photo", "true");
          }

          const nextUser = await updateProfile(formData);
          setAuthUser(nextUser);
          setSelectedPhoto(null);
          setRemovePhoto(false);
          setProfileMessage("Profile updated successfully.");
        } catch (error) {
          if (error instanceof ApiError) {
            setProfileError(error.message);
            return;
          }

          setProfileError("Unable to update your profile right now.");
        }
      })();
    });
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    setIsPasswordPending(true);

    void (async () => {
      try {
        const response = await changePassword(passwordForm);
        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        setPasswordMessage(
          response.detail ||
            "Password updated successfully. You can keep working with your new password.",
        );
      } catch (error) {
        if (error instanceof ApiError) {
          setPasswordError(error.message);
          return;
        }

        setPasswordError("Unable to update your password right now.");
      } finally {
        setIsPasswordPending(false);
      }
    })();
  };

  return (
    <div className="module-page">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Profile
            </div>
            <div className="flex items-start gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Profile Settings
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600">
                  Manage your profile details, profile photo, and account
                  security from one place.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Role</p>
              <p className="hero-metric-value text-xl">
                {user?.role.name ?? "Staff"}
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Phone</p>
              <p className="hero-metric-value text-xl">
                {profileForm.phone_number ? "Set" : "Missing"}
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Joined</p>
              <p className="hero-metric-value text-xl">
                {formatJoinDate(user?.date_joined)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ModuleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <div className="module-page-stage">
        {activeTab === "details" ? (
          <form
            className="panel module-tab-panel p-6"
            onSubmit={handleProfileSubmit}
          >
            <p className="section-label">Profile Details</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Update personal information
            </h2>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-6">
                <p className="section-label">Profile Photo</p>
                <div className="mt-4 flex flex-col items-start text-left">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt={
                        `${profileForm.first_name} ${profileForm.last_name}`.trim() ||
                        "Profile photo"
                      }
                      className="h-28 w-28 rounded-[2rem] border border-slate-200 object-cover shadow-[0_18px_40px_rgba(18,38,58,0.08)]"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border border-sky-200 bg-sky-100 text-3xl font-semibold text-sky-700">
                      {initials || "IB"}
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-100 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-200/70"
                  >
                    <Camera className="h-4 w-4" />
                    {selectedPhoto
                      ? "Replace selected photo"
                      : "Upload new photo"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhoto(null);
                      setRemovePhoto(true);
                      setProfileMessage("");
                      setProfileError("");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove photo
                  </button>

                  <p className="text-xs leading-6 text-slate-500">
                    Allowed formats are JPG, PNG, and WEBP. The backend
                    validates photo size and file type.
                  </p>
                </div>
              </div>

              <div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      First name
                    </span>
                    <input
                      className={fieldClassName}
                      value={profileForm.first_name}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          first_name: event.target.value,
                        }))
                      }
                      placeholder="First name"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Last name
                    </span>
                    <input
                      className={fieldClassName}
                      value={profileForm.last_name}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          last_name: event.target.value,
                        }))
                      }
                      placeholder="Last name"
                    />
                  </label>

                  <label className="block space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Email
                    </span>
                    <input
                      type="email"
                      className={fieldClassName}
                      value={profileForm.email}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="Email address"
                    />
                  </label>

                  <label className="block space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Phone number
                    </span>
                    <input
                      className={fieldClassName}
                      value={profileForm.phone_number}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          phone_number: event.target.value,
                        }))
                      }
                      placeholder="+256700000000"
                    />
                  </label>
                </div>

                {profileError ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {profileError}
                  </div>
                ) : null}

                {profileMessage ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {profileMessage}
                  </div>
                ) : null}

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isProfilePending}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,#1f87ad,#0f6d8d)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(32,141,183,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isProfilePending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving profile
                      </>
                    ) : (
                      "Save profile changes"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : null}

        {activeTab === "security" ? (
          <form
            className="panel module-tab-panel relative p-6"
            onSubmit={handlePasswordSubmit}
          >
            {isPasswordPending ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/78 backdrop-blur-[2px]">
                <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 shadow-[0_18px_40px_rgba(14,116,144,0.12)]">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Updating your password and keeping your session active...
                </div>
              </div>
            ) : null}
            <div>
              <p className="section-label">Security</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Change password
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Update your password here. Once it saves, your session stays
                active and future sign-ins will use the new password.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Current password
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  className={fieldClassName}
                  disabled={isPasswordPending}
                  value={passwordForm.current_password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      current_password: event.target.value,
                    }))
                  }
                  placeholder="Current password"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  New password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={fieldClassName}
                  disabled={isPasswordPending}
                  value={passwordForm.new_password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      new_password: event.target.value,
                    }))
                  }
                  placeholder="New password"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Confirm password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={fieldClassName}
                  disabled={isPasswordPending}
                  value={passwordForm.confirm_password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirm_password: event.target.value,
                    }))
                  }
                  placeholder="Confirm password"
                />
              </label>
            </div>

            {passwordError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </div>
            ) : null}

            {passwordMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {passwordMessage}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isPasswordPending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,#1f87ad,#0f6d8d)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(32,141,183,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPasswordPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Saving new password
                  </>
                ) : (
                  "Update password"
                )}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
