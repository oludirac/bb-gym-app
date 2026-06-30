import { requireUser } from "@/lib/auth/session";
import { FormSubmitButton } from "@/components/form-submit-button";
import { updateProfileSettings } from "./actions";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [{ error, message }, { profile, settings, user }] = await Promise.all([
    searchParams,
    requireUser()
  ]);
  const displayName = profile?.display_name || user.email || "";
  const unitPreference = profile?.unit_preference ?? "kg";
  const defaultRestSeconds = settings?.default_rest_seconds ?? 120;
  const theme = settings?.theme === "light" ? "light" : "dark";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">Settings</h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Name and units.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      <form action={updateProfileSettings} className="space-y-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Display name</span>
          <input
            name="displayName"
            defaultValue={displayName}
            className="min-h-12 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3 text-base outline-none focus:border-[color:var(--accent)]"
            required
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Units</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["kg", "lb"] as const).map((unit) => (
              <label
                key={unit}
                className="flex min-h-12 items-center gap-2 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3"
              >
                <input
                  type="radio"
                  name="unitPreference"
                  value={unit}
                  defaultChecked={unitPreference === unit}
                  className="size-4 accent-[color:var(--accent)]"
                />
                <span className="text-sm font-semibold uppercase">{unit}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Theme</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["dark", "light"] as const).map((option) => (
              <label
                key={option}
                className="flex min-h-12 items-center gap-2 rounded-md border border-[color:var(--panel-border)] bg-zinc-950 px-3"
              >
                <input
                  type="radio"
                  name="theme"
                  value={option}
                  defaultChecked={theme === option}
                  className="size-4 accent-[color:var(--accent)]"
                />
                <span className="text-sm font-semibold capitalize">
                  {option}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <input
          type="hidden"
          name="defaultRestSeconds"
          value={defaultRestSeconds}
        />

        <FormSubmitButton pendingLabel="Saving...">
          Save settings
        </FormSubmitButton>
      </form>
    </div>
  );
}
