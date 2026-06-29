import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/exercises", label: "Exercises" },
  { href: "/workouts/active", label: "Workout" },
  { href: "/programs", label: "Programs" },
  { href: "/settings", label: "Settings" }
];

export default function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col">
      <div className="flex-1 px-4 pb-24 pt-5">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 border-t border-[color:var(--panel-border)] bg-zinc-950/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-12 items-center justify-center rounded-md px-2 text-center text-[11px] font-medium text-zinc-300"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
