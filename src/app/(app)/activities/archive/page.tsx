import { Archive } from "lucide-react";
import { ActivityTable } from "@/components/activities/activity-table";
import { ClearArchiveButton } from "@/components/activities/clear-archive-button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { listActivities } from "@/lib/data/activities";

export const metadata = { title: "Archive · YunoCRM" };

/**
 * Completed activities, most recently finished first.
 *
 * Not a separate table or an extra flag — the archive is simply the other
 * side of `done`. Which means unticking a row here puts it straight back on
 * the open list, and the dashboard picks it up again if it is still due.
 */
export default async function ArchivePage() {
  const { ok, data: activities, error } = await listActivities(true);

  if (!ok) return <ErrorState message={error} />;

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title="The archive is empty"
        description="Activities land here once you tick them off. Nothing has been completed yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Above the table and right-aligned, in the same place the "+ Add"
          button sits on other screens — but grey, not brand-coloured: this is
          the one destructive control in the app and it should not look like
          the primary thing to do. */}
      <div className="flex justify-end">
        <ClearArchiveButton count={activities.length} />
      </div>

      <ActivityTable activities={activities} archived />
    </div>
  );
}
