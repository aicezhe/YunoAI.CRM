"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { DoneCheckbox } from "@/components/done-checkbox";
import { ActivityIcon } from "@/components/ui/badges";
import { SortHeader, SortPill, type SortDirection } from "@/components/ui/sort";
import { Blank, Card, Cell, Row, RowLink, Table } from "@/components/ui/table";
import { groupActivities } from "@/lib/activities-view";
import type { ActivityRow } from "@/lib/data/types";
import { formatDue } from "@/lib/format";

/**
 * The urgent marker: an amber exclamation disc ahead of the subject, and a
 * light brand wash over the whole row (see urgentTint below).
 *
 * Amber for the icon rather than the brand lavender, which is the colour of
 * every link and button here and so carries no urgency of its own. The row
 * tint is lavender on purpose though — it says "highlighted", while the
 * disc alone says "why".
 *
 * Hidden once an activity is done — priority answers "what do I do next",
 * which is why the archive is not sorted by it either (see listActivities).
 */
function UrgentMark({ activity }: { activity: ActivityRow }) {
  if (!isUrgent(activity)) return null;
  return (
    <CircleAlert
      className="h-4 w-4 shrink-0 fill-amber-400 text-white"
      strokeWidth={2.25}
      aria-label="Urgent"
    />
  );
}

function isUrgent(activity: ActivityRow): boolean {
  return activity.priority === "urgent" && !activity.done;
}

/**
 * A flat brand tint, written as a gradient on purpose: background-image
 * layers over background-color, so the same class works on the transparent
 * table rows and the white mobile cards without fighting their own bg
 * utilities.
 *
 * That layering also means the row's own hover background sits *underneath*
 * this and is invisible through it — checked in the browser, the hover
 * genuinely stopped reading on urgent rows. So the tint deepens on hover
 * itself, keeping the feedback these rows would otherwise lose.
 */
const URGENT_TINT =
  "bg-gradient-to-r from-brand-100/55 to-brand-100/55 transition-[--tw-gradient-from,--tw-gradient-to] duration-150 ease-out hover:from-brand-200/70 hover:to-brand-200/70";

function urgentTint(activity: ActivityRow): string {
  return isUrgent(activity) ? URGENT_TINT : "";
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
  /** Changes the date column's heading — "Due" is wrong for work that is
   *  already finished — and the direction it opens in. Passed explicitly
   *  rather than inferred from the first row, which would silently mislabel
   *  a mixed list. */
  archived = false,
}: {
  activities: ActivityRow[];
  archived?: boolean;
}) {
  const label = archived ? "Completed" : "Due";

  // Open work reads soonest-first, the archive most-recently-finished first —
  // the order each list is actually read in, and the one the query already
  // applied. Clicking the header flips it from there.
  const [direction, setDirection] = useState<SortDirection>(archived ? "desc" : "asc");
  const toggle = () => setDirection((d) => (d === "asc" ? "desc" : "asc"));

  // Urgent stays pinned above everything else, sorted by date inside its own
  // block. Kept as two lists rather than one so each can be captioned — a
  // pinned row that is not labelled reads as a sorting bug, which is exactly
  // what happened the first time this shipped without the captions.
  const { urgent, rest } = useMemo(
    () => groupActivities(activities, direction, !archived),
    [activities, direction, archived],
  );
  const total = urgent.length + rest.length;
  // Only worth captioning when there are both kinds — one block needs no
  // label to explain itself.
  const captioned = urgent.length > 0 && rest.length > 0;

  return (
    <>
      {/* Below md the table's headers are gone, so the card list carries its
          own trigger — same pill the deals list uses. */}
      <div className="mb-3 flex md:hidden">
        <SortPill label={label} active direction={direction} onClick={toggle} />
      </div>

      <Table
        columns={[
          "Type",
          "Subject",
          "Related to",
          <SortHeader key="due" label={label} active direction={direction} onClick={toggle} />,
          "Done",
        ]}
      >
        {captioned && <CaptionRow label="Urgent" />}
        {[...urgent, ...rest].map((activity, i) => {
          const related = relatedTo(activity);
          const startsRest = captioned && i === urgent.length;
          return (
            <Fragment key={activity.id}>
              {startsRest && <CaptionRow label="Everything else" />}
            <Row key={activity.id} index={i} count={total} className={urgentTint(activity)}>
              <Cell className="w-16">
                <ActivityIcon type={activity.type} />
              </Cell>

              <RowLink href={`/activities/${activity.id}`}>
                <span className="flex items-center gap-1.5">
                  <UrgentMark activity={activity} />
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
            </Fragment>
          );
        })}
      </Table>

      <div className="space-y-3 md:hidden">
        {captioned && <CardCaption label="Urgent" />}
        {[...urgent, ...rest].map((activity, i) => {
          const related = relatedTo(activity);
          return (
            <Fragment key={activity.id}>
              {captioned && i === urgent.length && <CardCaption label="Everything else" />}
            <Card index={i} count={total} className={urgentTint(activity)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ActivityIcon type={activity.type} />
                  <UrgentMark activity={activity} />
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
            </Fragment>
          );
        })}
      </div>
    </>
  );
}

/**
 * The line that turns a pinned block into a group. Without it, urgent rows
 * sitting above an otherwise date-ordered column read as the sort being
 * broken — there is nothing on the row to say it was lifted deliberately.
 */
function CaptionRow({ label }: { label: string }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="border-b border-brand-200/40 bg-brand-50/40 px-5 py-1.5 text-[11px] font-semibold tracking-wide text-gray-400 uppercase"
      >
        {label}
      </td>
    </tr>
  );
}

function CardCaption({ label }: { label: string }) {
  return (
    <p className="pt-1 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">{label}</p>
  );
}
