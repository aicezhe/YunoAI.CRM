import { CalendarCheck } from "lucide-react";
import { ActivityTable } from "@/components/activities/activity-table";
import { AddButton } from "@/components/ui/add-button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { listActivities } from "@/lib/data/activities";

export const metadata = { title: "Activities · YunoCRM" };

export default async function OpenActivitiesPage() {
  const { ok, data: activities, error } = await listActivities(false);

  if (!ok) return <ErrorState message={error} />;

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Nothing open"
        description="Every activity is done. Completed ones move to the archive, where you can reopen or clear them."
        action={<AddButton label="Add an activity" size="large" href="/activities/new" />}
      />
    );
  }

  return <ActivityTable activities={activities} />;
}
