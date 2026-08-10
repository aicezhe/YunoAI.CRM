"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

/**
 * Sign-out is a Server Action — the Supabase client is server-side only, so
 * clearing the session cookie has to happen there too.
 *
 * min-h-11 holds the tap target at the 44px touch minimum on phones; from sm
 * up the padding alone covers it and the button returns to its compact size.
 */
export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => void signOut())}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-brand-500/15 bg-brand-500/[0.06] px-4 py-2 text-sm font-medium text-brand-500/80 transition hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-brand-500 disabled:opacity-60 sm:min-h-0"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      <span className={compact ? "sr-only" : undefined}>
        {pending ? "Signing out…" : "Sign out"}
      </span>
    </button>
  );
}
