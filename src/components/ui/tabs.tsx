"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Tab = { href: string; label: string; count?: number };

/**
 * Segmented tabs, used by Contacts to hold People and Organizations in one
 * section.
 *
 * Real links, not local state: each tab is its own route, so a tab can be
 * bookmarked, opened in a new window, and reached by the back button. The
 * pill sits on a lavender track — the same active-on-white treatment the
 * sidebar uses, so "you are here" reads the same way in both places.
 */
export function Tabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 rounded-xl border border-brand-200/70 bg-brand-100/70 p-1"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={
              "inline-flex min-h-9 items-center gap-2 rounded-lg px-4 text-sm transition-colors " +
              (active
                ? "bg-white font-semibold text-brand-500 shadow-sm"
                : "font-medium text-gray-500 hover:text-gray-900")
            }
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={
                  "rounded-full px-1.5 text-xs font-semibold " +
                  (active ? "bg-brand-100 text-brand-500" : "bg-white/70 text-gray-400")
                }
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
