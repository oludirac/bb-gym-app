export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-5 py-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-normal">Create Account</h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Signup will use Supabase Auth and create a profile row automatically.
        </p>
      </div>
    </div>
  );
}
