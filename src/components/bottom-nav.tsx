"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, NAV_ITEMS } from "./nav-items";

/**
 * Fixed bottom navigation for mobile (below md). Hidden at md and up, where
 * Sidebar takes over — see (app)/layout.tsx. Reads the same NAV_ITEMS list
 * Sidebar does.
 *
 * Seven tabs is more than a phone comfortably fits, so each one uses its
 * shortLabel and the row scrolls horizontally rather than crushing every
 * label below legibility on a 320px screen. Nothing is hidden behind a
 * "More" sheet: at this stage every section is equally new, and burying two
 * of them would make them undiscoverable.
 */
export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-200 bg-gradient-to-t from-brand-100 to-brand-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around overflow-x-auto px-1">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                "flex min-h-16 min-w-[3.125rem] flex-1 flex-col items-center justify-center gap-1 transition-colors " +
                (active ? "text-brand-500" : "text-gray-400")
              }
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              {/* Tightened tracking, not a smaller size: at 375px seven labels
                  need roughly one character's worth of extra room, and
                  "Contracts" is the one that runs out first. */}
              <span className="max-w-full truncate text-[10px] font-medium tracking-tight">
                {item.shortLabel ?? item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
