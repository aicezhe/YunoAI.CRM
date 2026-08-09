import { AddButton } from "@/components/ui/add-button";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { countActivities } from "@/lib/data/activities";

/**
 * Shared shell for the open list and the archive, the same shape Contacts
 * uses: header and tabs live here, so switching between them swaps only the
 * table and the counts never flicker.
 */
export default async function ActivitiesLayout({ children }: { children: React.ReactNode }) {
  const counts = await countActivities();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Activities"
        description="Calls, meetings, tasks and notes across every record."
        action={<AddButton label="Add activity" href="/activities/new" />}
      />

      <div className="mt-6">
        <Tabs
          tabs={[
            { href: "/activities/open", label: "Open", count: counts.open },
            { href: "/activities/archive", label: "Archive", count: counts.archived },
          ]}
        />
      </div>

      <div className="mt-5">{children}</div>
    </main>
  );
}
