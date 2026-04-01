type AuthScreenProps = {
  title: string;
  message: string;
};

export function AuthScreen({ title, message }: AuthScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 text-slate-900">
      <div className="panel w-full max-w-lg p-8 text-center">
        <div className="mx-auto mb-5 h-14 w-14 animate-pulse rounded-full border border-sky-200 bg-sky-100" />
        <p className="section-label">Authentication</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{message}</p>
      </div>
    </div>
  );
}
