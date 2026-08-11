import Link from "next/link";
import { CalendarPlus, Handshake, Plus, Users } from "lucide-react";
import { DoneCheckbox } from "@/components/done-checkbox";
import { ActivityIcon, StageBadge, StatusBadge } from "@/components/ui/badges";
import { RecordCard } from "@/components/ui/record";
import { InlineEmpty } from "@/components/ui/states";
import type { ActivityRow, DealRow, PersonRow, Result } from "@/lib/data/types";
import { formatDue, formatMoney } from "@/lib/format";

/**
 * The blocks under a contact's or a company's own fields: the records on the
 * other end of its links.
 *
 * The card already knew about these — deleting a contact was refused with
 * "is on 1 deal and can't be deleted" — but there was no way to see which
 * deal, which made the refusal read as the app being obstinate rather than
 * informative. These blocks are what make that message actionable.
 *
 * Capped, because a record page must not grow without bound: a company with
 * forty deals would push its own fields off the top of the screen and turn
 * the page into a second, worse deals list.
 */
const LIMIT = 5;

function Overflow({ shown, total, noun }: { shown: number; total: number; noun: string }) {
  if (total <= shown) return null;
  return (
    <p className="pt-3 text-xs text-gray-400">
      Showing {shown} of {total} {noun}.
    </p>
  );
}

/** The block's own "add" control. A link rather than an inline form: the
 *  create forms carry enough fields that opening one inside a record card
 *  would bury the record it belongs to. */
function AddButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 text-xs font-semibold text-white shadow-sm shadow-brand-500/25 transition-colors hover:bg-brand-600"
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      {label}
    </Link>
  );
}

/** One row of a related block. `relative` pairs with the stretched link
 *  inside, so the whole row is the click target while any second control in
 *  it (a Done checkbox, an email link) stays clickable on its own — the same
 *  pattern the tables use. */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative flex items-center gap-3 py-3 transition-colors duration-150 ease-out hover:bg-brand-50/60">
      {children}
    </li>
  );
}

function StretchedLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="truncate text-sm font-medium text-gray-900 transition-colors after:absolute after:inset-0 after:content-[''] hover:text-brand-600"
    >
      {children}
    </Link>
  );
}

export function RelatedDeals({
  deals,
  addHref,
  index,
}: {
  deals: Result<DealRow[]>;
  addHref: string;
  index: number;
}) {
  return (
    <RecordCard index={index} title="Deals" action={<AddButton href={addHref} label="Add deal" />}>
      {!deals.ok ? (
        <p className="py-4 text-sm text-gray-500">{deals.error}</p>
      ) : deals.data.length === 0 ? (
        <InlineEmpty
          icon={Handshake}
          title="No deals yet."
          action={
            <Link
              href={addHref}
              className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-500 hover:underline"
            >
              Create the first one
            </Link>
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-brand-200/40">
            {deals.data.slice(0, LIMIT).map((deal) => (
              <Row key={deal.id}>
                <div className="min-w-0 flex-1">
                  <StretchedLink href={`/deals/${deal.id}`}>{deal.title}</StretchedLink>
                  <p className="mt-0.5 text-xs text-gray-400">{deal.ownerName ?? "Unassigned"}</p>
                </div>
                {/* A closed deal shows Won/Lost instead of the stage it
                    happened to be sitting in — the stage stopped being the
                    answer to "where is this" the moment it closed. */}
                <span className="relative z-10 shrink-0">
                  {deal.status === "open" ? (
                    <StageBadge name={deal.stageName} />
                  ) : (
                    <StatusBadge status={deal.status} />
                  )}
                </span>
                <span className="w-24 shrink-0 text-right text-sm font-medium text-gray-900 tabular-nums">
                  {formatMoney(deal.value, deal.currency)}
                </span>
              </Row>
            ))}
          </ul>
          <Overflow shown={LIMIT} total={deals.data.length} noun="deals" />
        </>
      )}
    </RecordCard>
  );
}

export function RelatedActivity({
  activities,
  addHref,
  index,
}: {
  activities: Result<ActivityRow[]>;
  addHref: string;
  index: number;
}) {
  return (
    <RecordCard
      index={index}
      title="Activity"
      action={<AddButton href={addHref} label="Add activity" />}
    >
      {!activities.ok ? (
        <p className="py-4 text-sm text-gray-500">{activities.error}</p>
      ) : activities.data.length === 0 ? (
        <InlineEmpty
          icon={CalendarPlus}
          title="Nothing logged yet."
          action={
            <Link
              href={addHref}
              className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-500 hover:underline"
            >
              Log the first activity
            </Link>
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-brand-200/40">
            {activities.data.slice(0, LIMIT).map((activity) => (
              <Row key={activity.id}>
                <ActivityIcon type={activity.type} />
                <div className="min-w-0 flex-1">
                  <span
                    className={
                      "block truncate text-sm " +
                      (activity.done ? "text-gray-400 line-through" : "text-gray-900")
                    }
                  >
                    <StretchedLink href={`/activities/${activity.id}`}>
                      {activity.subject}
                    </StretchedLink>
                  </span>
                  <p className="mt-0.5 text-xs text-gray-400">{formatDue(activity.dueAt)}</p>
                </div>
                <span className="relative z-10 shrink-0">
                  <DoneCheckbox id={activity.id} done={activity.done} label={activity.subject} />
                </span>
              </Row>
            ))}
          </ul>
          <Overflow shown={LIMIT} total={activities.data.length} noun="activities" />
        </>
      )}
    </RecordCard>
  );
}

export function RelatedPeople({
  people,
  addHref,
  index,
}: {
  people: Result<PersonRow[]>;
  addHref: string;
  index: number;
}) {
  return (
    <RecordCard index={index} title="People" action={<AddButton href={addHref} label="Add person" />}>
      {!people.ok ? (
        <p className="py-4 text-sm text-gray-500">{people.error}</p>
      ) : people.data.length === 0 ? (
        <InlineEmpty
          icon={Users}
          title="Nobody here yet."
          action={
            <Link
              href={addHref}
              className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-500 hover:underline"
            >
              Add the first contact
            </Link>
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-brand-200/40">
            {people.data.slice(0, LIMIT).map((person) => (
              <Row key={person.id}>
                <div className="min-w-0 flex-1">
                  <StretchedLink href={`/contacts/people/${person.id}`}>{person.name}</StretchedLink>
                  {person.email && (
                    <a
                      href={`mailto:${person.email}`}
                      className="relative z-10 mt-0.5 block truncate text-xs text-gray-400 transition-colors hover:text-brand-600"
                    >
                      {person.email}
                    </a>
                  )}
                </div>
                {person.phone && (
                  <a
                    href={`tel:${person.phone.replace(/\s/g, "")}`}
                    className="relative z-10 shrink-0 text-sm font-medium whitespace-nowrap text-brand-600 transition hover:underline"
                  >
                    {person.phone}
                  </a>
                )}
              </Row>
            ))}
          </ul>
          <Overflow shown={LIMIT} total={people.data.length} noun="people" />
        </>
      )}
    </RecordCard>
  );
}
