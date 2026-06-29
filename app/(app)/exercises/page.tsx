export default function ExercisesPage() {
  return <PageScaffold title="Exercises" />;
}

function PageScaffold({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
      <p className="text-sm leading-6 text-[color:var(--muted)]">
        This surface will be built after the schema and auth foundation are in
        place.
      </p>
    </div>
  );
}
