import Link from "next/link";
import { DoneCheckbox } from "@/components/done-checkbox";
import { ActivityIcon } from "@/components/ui/badges";
import { Blank, Cell, Row, RowLink, Table } from "@/components/ui/table";
import type { ActivityRow } from "@/lib/data/types";
import { formatDue } from "@/lib/format";

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
    <Table columns={["Type", "Subject", "Related to", archived ? "Completed" : "Due", "Done"]}>
      {activities.map((activity, i) => {
        const related = relatedTo(activity);
        return (
          <Row key={activity.id} index={i} count={activities.length}>
            <Cell className="w-16">
              <ActivityIcon type={activity.type} />
            </Cell>

            <RowLink href={`/activities/${activity.id}`}>
              <span className={activity.done ? "text-gray-400 line-through" : undefined}>
                {activity.subject}
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
  );
}
