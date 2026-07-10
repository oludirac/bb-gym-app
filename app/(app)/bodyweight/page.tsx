import { FormSubmitButton } from "@/components/form-submit-button";
import { Scale, Trash2 } from "lucide-react";
import {
  deleteBodyweightLog,
  saveBodyweightLog
} from "@/app/(app)/bodyweight/actions";
import { getBodyweightLogs } from "@/lib/tracking/queries";
import { requireUser } from "@/lib/auth/session";
import { formatWeight, kgToDisplayUnit } from "@/lib/unit-conversion";

function todayDate() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${value}T00:00:00`));
}

export default async function BodyweightPage() {
  const { profile, supabase } = await requireUser();
  const unit = profile?.unit_preference ?? "kg";
  const logs = await getBodyweightLogs(supabase);
  const latest = logs[0];
  const chartLogs = [...logs].reverse();
  const weights = chartLogs.map((log) => Number(log.weight_kg));
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
  const range = Math.max(1, maxWeight - minWeight);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[color:var(--accent)]">
          Weight
        </p>
        <h1 className="text-3xl font-black tracking-normal">
          Weigh-ins
        </h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Latest: {latest ? formatWeight(latest.weight_kg, unit) : "No logs yet"}.
        </p>
      </header>

      <form
        action={saveBodyweightLog}
        className="app-card space-y-3 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[color:var(--panel-raised)] text-[color:var(--accent)]">
            <Scale aria-hidden="true" className="size-5" />
          </div>
          <h2 className="text-base font-black">Add weigh-in</h2>
        </div>
        <div className="grid grid-cols-[1fr_1fr] gap-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Date</span>
            <input
              name="loggedOn"
              type="date"
              defaultValue={todayDate()}
              className="field-base text-base"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Weight ({unit})</span>
            <input
              name="weight"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.1"
              defaultValue={
                latest
                  ? Math.round(kgToDisplayUnit(latest.weight_kg, unit) * 10) /
                    10
                  : ""
              }
              className="field-base text-base"
            />
          </label>
        </div>
        <input
          name="notes"
          placeholder="Notes"
          className="field-base w-full text-base"
        />
        <FormSubmitButton pendingLabel="Saving...">Save weight</FormSubmitButton>
      </form>

      {chartLogs.length > 1 ? (
        <section className="app-card-flat p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Recent trend</h2>
            <p className="text-xs text-[color:var(--muted)]">
              Last {chartLogs.length}
            </p>
          </div>
          <div className="mt-4 flex h-32 items-end gap-1">
            {chartLogs.map((log) => {
              const height =
                18 + ((Number(log.weight_kg) - minWeight) / range) * 110;

              return (
                <div
                  key={log.id}
                  title={`${formatDate(log.logged_on)} ${formatWeight(
                    log.weight_kg,
                    unit
                  )}`}
                  className="flex-1 rounded-t-sm bg-[color:var(--accent)]"
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Recent</h2>
        {logs.length === 0 ? (
          <div className="app-card-flat p-4">
            <h3 className="text-base font-semibold">No weigh-ins yet</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Add one above.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {logs.map((log) => (
              <article
                key={log.id}
                className="app-card-flat p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">
                      {formatWeight(log.weight_kg, unit)}
                    </h3>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {formatDate(log.logged_on)}
                    </p>
                    {log.notes ? (
                      <p className="mt-2 text-sm text-[color:var(--muted)]">
                        {log.notes}
                      </p>
                    ) : null}
                  </div>
                  <form action={deleteBodyweightLog}>
                    <input type="hidden" name="logId" value={log.id} />
                    <FormSubmitButton
                      pendingLabel="Deleting..."
                      className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-[color:var(--danger)]/40 px-3 text-sm font-black text-red-200 disabled:cursor-wait disabled:opacity-70"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      Delete
                    </FormSubmitButton>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
