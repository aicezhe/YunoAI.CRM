import { BottomNav } from "@/components/bottom-nav";
import { Sidebar } from "@/components/sidebar";
import { SignOutButton } from "@/components/sign-out-button";
import { Wordmark } from "@/components/wordmark";
import { requireUser } from "@/lib/auth/current-user";

/**
 * Shell for every signed-in route: a top bar + BottomNav below md, a Sidebar
 * at md and up.
 *
 * requireUser() here is the real authorization boundary. proxy.ts already
 * turned anonymous visitors away, but that check runs before routing and is
 * deliberately optimistic — repeating it next to the render means a page
 * cannot be reached with a stale or forged cookie even if the proxy matcher
 * is later narrowed. The call is React-cache()'d, so pages below that also
 * need the user share this one round-trip.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Mobile only — on desktop the same identity block lives in Sidebar. */}
      <header className="flex items-center justify-between gap-3 px-5 py-4 md:hidden">
        <Wordmark className="text-lg" />
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden truncate text-sm text-gray-500 sm:inline">{user.email}</span>
          <SignOutButton compact />
        </div>
      </header>

      <Sidebar isAdmin={isAdmin} name={user.name} email={user.email} role={user.role} />

      {/* pb clears the fixed BottomNav on mobile; md:ml clears the fixed
          Sidebar on desktop, where there is no bottom bar to clear. */}
      <div className="pb-24 md:ml-60 md:pb-0">{children}</div>

      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
