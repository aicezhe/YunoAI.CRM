"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { isActive, NAV_ITEMS, type NavItem } from "./nav-items";
import { SignOutButton } from "./sign-out-button";
import { Wordmark } from "./wordmark";

/**
 * Fixed left sidebar for desktop (md and up). Hidden below md, where
 * BottomNav takes over — see (app)/layout.tsx.
 *
 * The section hierarchy is drawn with size, weight and spacing, not colour:
 * Activities and Deals (the all-day pair) sit on top, slightly larger and
 * heavier; Contacts and Contracts follow after a hairline divider at normal
 * weight; Settings is pinned to the bottom, muted, apart from the work
 * sections. See NavItem.tier.
 *
 * The active marker is one shared motion.span with a layoutId: when the
 * route changes, Framer Motion animates the white pill from the old item to
 * the new one instead of blinking it out here and in there. This works
 * because the Sidebar instance itself survives navigation — it lives in the
 * (app) layout, and only template.tsx remounts per route.
 */
export function Sidebar({
  isAdmin,
  name,
  email,
  role,
  activityCount,
}: {
  isAdmin: boolean;
  name: string;
  email: string;
  role: string;
  /** Open activities — shown as a pill on the Activities item. The one badge
   *  in the nav, because "how much is on the pile" is the one number that
   *  changes what you click first. */
  activityCount: number;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const primary = items.filter((i) => i.tier === "primary");
  const secondary = items.filter((i) => i.tier === "secondary");
  const system = items.filter((i) => i.tier === "system");

  const renderItem = (item: NavItem) => {
    const active = isActive(pathname, item);
    const Icon = item.icon;
    const isPrimary = item.tier === "primary";
    const isSystem = item.tier === "system";

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={
          "group relative flex items-center gap-3 rounded-xl px-3.5 transition-colors duration-150 ease-out " +
          (isPrimary ? "py-3 text-[15px] " : "py-2.5 text-sm ") +
          (active
            ? "font-semibold text-brand-500"
            : isSystem
              ? "font-medium text-gray-400 hover:text-gray-600"
              : "font-medium text-gray-500 hover:text-gray-900")
        }
      >
        {/* The travelling pill. Only the active item renders it; the shared
            layoutId is what makes it glide between items on route change. */}
        {active && (
          <motion.span
            layoutId="sidebar-active-pill"
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 rounded-xl bg-white shadow-card"
            aria-hidden
          />
        )}
        {/* Hover wash on its own layer, under the content but over nothing —
            the active pill replaces it rather than stacking with it. */}
        {!active && (
          <span
            className="absolute inset-0 rounded-xl bg-brand-100/0 transition-colors duration-150 ease-out group-hover:bg-brand-100/60"
            aria-hidden
          />
        )}

        <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="relative z-10 flex-1 truncate">{item.label}</span>

        {item.href.startsWith("/activities") && activityCount > 0 && (
          <span
            className={
              "relative z-10 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums " +
              (active ? "bg-brand-100 text-brand-500" : "bg-brand-500/10 text-brand-500/80")
            }
          >
            {activityCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-brand-200/60 bg-gradient-to-b from-white to-brand-50 md:flex">
      <div className="px-6 pt-7 pb-8">
        <Wordmark className="text-lg" />
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-3.5" aria-label="Primary">
        <div className="space-y-1.5">{primary.map(renderItem)}</div>

        <div className="mx-3.5 my-4 h-px bg-brand-200/60" aria-hidden />

        <div className="space-y-1.5">{secondary.map(renderItem)}</div>

        {/* Settings sinks to the bottom of the nav column, visually apart
            from the sections above — it is about the workspace, not the
            pipeline. */}
        <div className="mt-auto pb-4">{system.map(renderItem)}</div>
      </nav>

      <div className="border-t border-brand-200/60 px-5 py-4">
        <div className="flex items-baseline gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{name}</p>
          <span className="shrink-0 text-[10px] font-semibold tracking-widest text-brand-400 uppercase">
            {role}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-400">{email}</p>
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
