import { LayoutGrid } from "lucide-react";
import { ParticleField } from "@/components/particle-field";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = { title: "Dashboard · YunoCRM" };

/**
 * The landing screen after sign-in. Unlike the other sections it greets the
 * user by name — proof, at a glance, that the session resolved server-side
 * rather than the shell merely rendering.
 *
 * getCurrentUser() is safe to call without a null check for the layout's
 * sake: the (app) layout already ran requireUser(), and this hits the same
 * cached result.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    // The same constellation as the login screen, so signing in doesn't drop
    // the backdrop. Only here, not in the shared layout: the other sections
    // will fill up with tables and forms, where a moving background behind
    // dense data is a distraction rather than a welcome.
    <div className="relative min-h-dvh overflow-hidden">
      <ParticleField className="pointer-events-none absolute inset-0 h-full w-full" />

      <main className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <PageHeader
          title={`Hi, ${user?.name ?? "there"}`}
          description="Your workspace at a glance."
        />
        <div className="mt-8">
          <EmptyState
            icon={LayoutGrid}
            title="Coming soon"
            description="Once organizations, people and deals are in, this is where their summary will live."
          />
        </div>
      </main>
    </div>
  );
}
