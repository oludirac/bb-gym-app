export default function AppLoading() {
  return (
    <div className="space-y-4">
      <div className="app-card h-40 animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="app-card-flat h-28 animate-pulse" />
        <div className="app-card-flat h-28 animate-pulse" />
      </div>
      <div className="app-card-flat h-20 animate-pulse" />
    </div>
  );
}
