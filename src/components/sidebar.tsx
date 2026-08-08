"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, NAV_ITEMS } from "./nav-items";
import { SignOutButton } from "./sign-out-button";
import { Wordmark } from "./wordmark";

/**
 * Fixed left sidebar for desktop (md and up). Hidden below md, where
 * BottomNav takes over — see (app)/layout.tsx.
 *
 * Always visible, no collapse or hamburger: that matches the standing B2B
 * pattern (Linear, Notion, Supabase) rather than a mobile drawer, since
 * desktop has the width to spare. Reads the same NAV_ITEMS list BottomNav
 * does, so the admin-only rule lives in exactly one place.
 */
export function Sidebar({
  isAdmin,
  name,
  email,
  role,
}: {
  isAdmin: boolean;
  name: string;
  email: string;
  role: string;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-brand-200 bg-gradient-to-b from-brand-100 to-brand-150 backdrop-blur-md md:flex">
      <div className="px-6 py-6">
        <Wordmark className="text-lg" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Primary">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors " +
                (active
                  ? "bg-white font-semibold text-brand-500 shadow-sm"
                  : "font-medium text-gray-500 hover:bg-white/50 hover:text-gray-900")
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-300 px-4 py-4">
        <div className="flex items-center gap-2 px-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{name}</p>
          {/* The role badge is the only visible sign of admin/member today;
              it keeps the distinction testable before any admin-only screen
              exists. */}
          <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-500 uppercase">
            {role}
          </span>
        </div>
        <p className="truncate px-2 text-xs text-gray-400">{email}</p>
        <div className="mt-3 px-2">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
