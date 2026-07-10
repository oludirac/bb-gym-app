import { Dumbbell } from "lucide-react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { requireUser } from "@/lib/auth/session";
import { onboardingPrefs } from "@/lib/onboarding";
import { saveOnboarding, skipOnboarding } from "./actions";

const goals = [
  { label: "Strength", value: "strength" },
  { label: "Muscle", value: "muscle" },
  { label: "General", value: "general" }
];

const experienceLevels = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" }
];

const equipment = ["Barbell", "Dumbbells", "Machines", "Cables", "Bodyweight"];

export default async function OnboardingPage() {
  const { profile, settings, user } = await requireUser();
  const onboarding = onboardingPrefs(settings);
  const displayName = profile?.display_name || user.email || "";
  const unit = profile?.unit_preference ?? "kg";
  const goal = onboarding?.goal ?? "strength";
  const experience = onboarding?.experience ?? "intermediate";
  const days = onboarding?.days_per_week ?? 3;
  const scheduleType = onboarding?.schedule_type ?? "sequence";
  const selectedEquipment = new Set(onboarding?.equipment ?? ["Barbell", "Dumbbells", "Machines"]);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-[color:var(--background)] px-4 py-5 text-[color:var(--foreground)]">
      <header className="border-b border-[color:var(--panel-border)] pb-5">
        <div className="flex size-10 items-center justify-center rounded-md bg-[color:var(--accent)] text-zinc-950">
          <Dumbbell aria-hidden="true" className="size-6" strokeWidth={2.6} />
        </div>
        <p className="mt-5 text-sm font-bold text-[color:var(--accent)]">
          Setup
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-normal">
          Make it yours
        </h1>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          A few choices so Today can point you at the right lift.
        </p>
      </header>

      <form action={saveOnboarding} className="flex-1 space-y-6 py-5">
        <section className="grid gap-3">
          <h2 className="text-base font-black">You</h2>
          <label className="grid gap-2">
            <span className="text-sm font-bold">Name</span>
            <input
              name="displayName"
              defaultValue={displayName}
              className="field-base"
            />
          </label>
          <fieldset className="grid grid-cols-2 gap-2">
            {(["kg", "lb"] as const).map((value) => (
              <label key={value} className="training-choice">
                <input
                  type="radio"
                  name="unitPreference"
                  value={value}
                  defaultChecked={unit === value}
                  className="size-4 accent-[color:var(--accent)]"
                />
                <span className="font-black uppercase">{value}</span>
              </label>
            ))}
          </fieldset>
        </section>

        <section className="grid gap-3">
          <h2 className="text-base font-black">Goal</h2>
          <div className="grid grid-cols-3 gap-2">
            {goals.map((item) => (
              <label key={item.value} className="training-choice justify-center">
                <input
                  type="radio"
                  name="goal"
                  value={item.value}
                  defaultChecked={goal === item.value}
                  className="size-4 accent-[color:var(--accent)]"
                />
                <span className="text-sm font-black">{item.label}</span>
              </label>
            ))}
          </div>
          <div className="grid gap-2">
            {experienceLevels.map((item) => (
              <label key={item.value} className="training-choice">
                <input
                  type="radio"
                  name="experience"
                  value={item.value}
                  defaultChecked={experience === item.value}
                  className="size-4 accent-[color:var(--accent)]"
                />
                <span className="font-black">{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-base font-black">Training week</h2>
          <label className="grid gap-2">
            <span className="text-sm font-bold">Days per week</span>
            <select name="daysPerWeek" defaultValue={days} className="field-base">
              {[2, 3, 4, 5, 6].map((value) => (
                <option key={value} value={value}>
                  {value} days
                </option>
              ))}
            </select>
          </label>
          <fieldset className="grid gap-2">
            <label className="training-choice">
              <input
                type="radio"
                name="scheduleType"
                value="sequence"
                defaultChecked={scheduleType !== "calendar"}
                className="size-4 accent-[color:var(--accent)]"
              />
              <span>
                <span className="block font-black">Rotating split</span>
                <span className="block text-xs text-[color:var(--muted)]">
                  Push, Pull, Legs, repeat
                </span>
              </span>
            </label>
            <label className="training-choice">
              <input
                type="radio"
                name="scheduleType"
                value="calendar"
                defaultChecked={scheduleType === "calendar"}
                className="size-4 accent-[color:var(--accent)]"
              />
              <span>
                <span className="block font-black">Scheduled days</span>
                <span className="block text-xs text-[color:var(--muted)]">
                  Monday Push, Wednesday Pull
                </span>
              </span>
            </label>
          </fieldset>
        </section>

        <section className="grid gap-3">
          <h2 className="text-base font-black">Equipment</h2>
          <div className="grid grid-cols-2 gap-2">
            {equipment.map((item) => (
              <label key={item} className="training-choice">
                <input
                  type="checkbox"
                  name="equipment"
                  value={item}
                  defaultChecked={selectedEquipment.has(item)}
                  className="size-4 accent-[color:var(--accent)]"
                />
                <span className="text-sm font-black">{item}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-base font-black">Start point</h2>
          <div className="grid gap-2">
            <label className="training-choice">
              <input
                type="radio"
                name="nextStep"
                value="starter"
                defaultChecked
                className="size-4 accent-[color:var(--accent)]"
              />
              <span className="font-black">Pick a starter plan</span>
            </label>
            <label className="training-choice">
              <input
                type="radio"
                name="nextStep"
                value="build"
                className="size-4 accent-[color:var(--accent)]"
              />
              <span className="font-black">Build my split</span>
            </label>
            <label className="training-choice">
              <input
                type="radio"
                name="nextStep"
                value="import"
                className="size-4 accent-[color:var(--accent)]"
              />
              <span className="font-black">Import CSV</span>
            </label>
          </div>
        </section>

        <FormSubmitButton pendingLabel="Saving setup...">
          Save setup
        </FormSubmitButton>
      </form>

      <form action={skipOnboarding} className="border-t border-[color:var(--panel-border)] pt-3">
        <FormSubmitButton
          pendingLabel="Skipping..."
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[color:var(--panel-border)] px-4 text-sm font-black text-[color:var(--muted)] disabled:cursor-wait disabled:opacity-70"
        >
          Skip for now
        </FormSubmitButton>
      </form>
    </main>
  );
}
