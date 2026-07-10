"use client";

import Link from "next/link";
import { BarChart3, Dumbbell, Flame, MoreHorizontal, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: Flame, label: "Today" },
  { href: "/workouts/active", icon: Dumbbell, label: "Workout" },
  { href: "/progress", icon: BarChart3, label: "Progress" },
  { href: "/programs", icon: Trophy, label: "Plans" },
  { href: "/more", icon: MoreHorizontal, label: "More" }
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/more") {
    return pathname === "/more";
  }

  if (href === "/workouts/active") {
    return pathname.startsWith("/workouts");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--panel-border)] bg-[#080a0d]/94 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-center text-[11px] font-bold transition ${
                active
                  ? "text-[color:var(--foreground)]"
                  : "text-[color:var(--muted)] active:bg-[color:var(--panel)]"
              }`}
            >
              {active ? (
                <span className="absolute top-1 h-1 w-5 rounded-full bg-[color:var(--accent)]" />
              ) : null}
              <Icon aria-hidden="true" className="size-5" strokeWidth={2.4} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
