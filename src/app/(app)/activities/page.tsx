import { CalendarCheck } from "lucide-react";
import { DoneCheckbox } from "@/components/done-checkbox";
import { ActivityIcon } from "@/components/ui/badges";
import { AddButton } from "@/components/ui/add-button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Blank, Cell, Row, RowLink, Table } from "@/components/ui/table";
import { listActivities } from "@/lib/data/activities";
import type { ActivityRow } from "@/lib/data/types";
import { formatDue } from "@/lib/format";

export const metadata = { title: "Activities · YunoCRM" };

/** Where the activity points. Deal first — that is the context a rep wants —
 *  falling back to the person, then the company. */
function relatedTo(activity: ActivityRow): { label: string; href: string } | null {
  if (activity.dealId) return { label: activity.dealTitle ?? "Deal", href: `/deals/${activity.dealId}` };
  if (activity.personId)
    return { label: activity.personName ?? "Contact", href: `/contacts/people/${activity.personId}` };
  if (activity.organizationId)
    return {
      label: activity.organizationName ?? "Organization",
      href: `/contacts/organizations/${activity.organizationId}`,
    };
  return null;
}

export default async function ActivitiesPage() {
  const { ok, data: activities, error } = await listActivities();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Activities"
        description="Calls, meetings, tasks and notes across every record."
        action={<AddButton label="Add activity" />}
      />

      <div className="mt-8">
        {!ok ? (
          <ErrorState message={error} />
        ) : activities.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No activities yet"
            description="Log a call, book a meeting or set yourself a task. Anything with a due date shows up on the dashboard."
            action={<AddButton label="Add your first activity" size="large" />}
          />
        ) : (
          <Table columns={["Type", "Subject", "Related to", "Due", "Done"]}>
            {activities.map((activity) => {
              const related = relatedTo(activity);
              return (
                <Row key={activity.id}>
                  <Cell className="w-16">
                    <ActivityIcon type={activity.type} />
                  </Cell>

                  <RowLink href={related?.href ?? "/activities"}>
                    <span className={activity.done ? "text-gray-400 line-through" : undefined}>
                      {activity.subject}
                    </span>
                  </RowLink>

                  <Cell muted>{related?.label ?? <Blank />}</Cell>

                  <Cell muted className="tabular-nums whitespace-nowrap">
                    {formatDue(activity.dueAt)}
                  </Cell>

                  <Cell className="w-20">
                    <DoneCheckbox id={activity.id} done={activity.done} label={activity.subject} />
                  </Cell>
                </Row>
              );
            })}
          </Table>
        )}
      </div>
    </main>
  );
}
