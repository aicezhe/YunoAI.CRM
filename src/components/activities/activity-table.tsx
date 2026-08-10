import Link from "next/link";
import { Flag } from "lucide-react";
import { DoneCheckbox } from "@/components/done-checkbox";
import { ActivityIcon } from "@/components/ui/badges";
import { Blank, Card, Cell, Row, RowLink, Table } from "@/components/ui/table";
import type { ActivityRow } from "@/lib/data/types";
import { formatDue } from "@/lib/format";

/**
 * The urgent marker: a small amber flag ahead of the subject.
 *
 * Amber rather than the brand lavender, which is the colour of every link
 * and button here and so carries no urgency of its own; and an icon rather
 * than a tinted row, which at three or four urgent items turns the list into
 * a block of colour and stops the flag meaning anything.
 *
 * Hidden once an activity is done — priority answers "what do I do next",
 * which is why the archive is not sorted by it either (see listActivities).
 */
function UrgentFlag({ activity }: { activity: ActivityRow }) {
  if (activity.priority !== "urgent" || activity.done) return null;
  return (
    <Flag
      className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500"
      strokeWidth={2.25}
      aria-label="Urgent"
    />
  );
}

/** The "Related to" column's own link — deal first, since that is the
 *  context a rep is usually working from, falling back to the person, then
 *  the company. The row's primary link (RowLink, below) goes to the
 *  activity's own page; this is a second, narrower link inside one cell. */
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

/**
 * Shared by the open list and the archive — the columns are the same and the
 * checkbox does the same job in both directions: ticking an open activity
 * files it away, unticking an archived one pulls it back out. That is the
 * whole restore path, so the archive needs no separate control for it.
 */
export function ActivityTable({
  activities,
  /** Only changes the date column's heading — "Due" is wrong for work that is
   *  already finished. Passed explicitly rather than inferred from the first
   *  row, which would silently mislabel a mixed list. */
  archived = false,
}: {
  activities: ActivityRow[];
  archived?: boolean;
}) {
  return (
    <>
      <Table columns={["Type", "Subject", "Related to", archived ? "Completed" : "Due", "Done"]}>
        {activities.map((activity, i) => {
          const related = relatedTo(activity);
          return (
            <Row key={activity.id} index={i} count={activities.length}>
              <Cell className="w-16">
                <ActivityIcon type={activity.type} />
              </Cell>

              <RowLink href={`/activities/${activity.id}`}>
                <span className="flex items-center gap-1.5">
                  <UrgentFlag activity={activity} />
                  <span className={"transition-colors duration-200 " + (activity.done ? "text-gray-400 line-through" : "")}>
                    {activity.subject}
                  </span>
                </span>
              </RowLink>

              <Cell muted>
                {related ? (
                  <Link href={related.href} className="relative z-10 hover:text-brand-600 hover:underline">
                    {related.label}
                  </Link>
                ) : (
                  <Blank />
                )}
              </Cell>

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

      <div className="space-y-3 md:hidden">
        {activities.map((activity, i) => {
          const related = relatedTo(activity);
          return (
            <Card key={activity.id} index={i} count={activities.length}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ActivityIcon type={activity.type} />
                  <UrgentFlag activity={activity} />
                  <Link
                    href={`/activities/${activity.id}`}
                    className={
                      "min-w-0 truncate font-medium transition-colors duration-200 after:absolute after:inset-0 after:content-[''] " +
                      (activity.done ? "text-gray-400 line-through" : "text-gray-900")
                    }
                  >
                    {activity.subject}
                  </Link>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs whitespace-nowrap text-gray-400 tabular-nums">
                    {formatDue(activity.dueAt)}
                  </span>
                  <DoneCheckbox id={activity.id} done={activity.done} label={activity.subject} />
                </div>
              </div>

              {related && (
                <p className="mt-2 truncate pl-11 text-sm text-gray-500">
                  <Link href={related.href} className="relative z-10 hover:text-brand-600 hover:underline">
                    {related.label}
                  </Link>
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
