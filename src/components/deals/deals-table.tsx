"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Handshake } from "lucide-react";
import { StageBadge, StatusBadge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/states";
import { Blank, CardLink, Cell, Row, RowLink, Table } from "@/components/ui/table";
import type { DealRow } from "@/lib/data/types";
import { formatDate, formatMoney } from "@/lib/format";

type SortKey = "value" | "expectedClose" | "stage";
type SortDirection = "asc" | "desc";
type Sort = { key: SortKey; direction: SortDirection };

// The direction a first click on each column should produce: value leads
// with the biggest deals (what to prioritize), expected close leads with the
// soonest (what's burning). Stage never toggles — see stageRank below.
const DEFAULT_DIRECTION: Record<SortKey, SortDirection> = {
  value: "desc",
  expectedClose: "asc",
  stage: "asc",
};

/** Funnel order: open deals by pipeline position, then Won, then Lost — a
 *  closed deal keeps whatever stage it was in when it closed, so status has
 *  to be checked first or Won/Lost would scatter across the open ranks. */
function stageRank(deal: DealRow): [number, number] {
  if (deal.status === "won") return [1, 0];
  if (deal.status === "lost") return [2, 0];
  return [0, deal.stagePosition ?? Infinity];
}

function compareDeals(key: SortKey, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (a: DealRow, b: DealRow): number => {
    if (key === "stage") {
      const [bucketA, posA] = stageRank(a);
      const [bucketB, posB] = stageRank(b);
      return bucketA !== bucketB ? bucketA - bucketB : posA - posB;
    }
    if (key === "value") {
      // A deal with no value is neither the biggest nor the smallest — it's
      // unknown, so it sits out of the ranking entirely, last either way.
      if (a.value === null) return b.value === null ? 0 : 1;
      if (b.value === null) return -1;
      return (a.value - b.value) * sign;
    }
    if (a.expectedCloseDate === null) return b.expectedCloseDate === null ? 0 : 1;
    if (b.expectedCloseDate === null) return -1;
    return a.expectedCloseDate < b.expectedCloseDate ? -sign : a.expectedCloseDate > b.expectedCloseDate ? sign : 0;
  };
}

/** YYYY-MM-DD, matching the date-only column so "this week"/"overdue" can
 *  compare as plain strings instead of parsing a date-only value as a Date —
 *  the latter reads it as UTC midnight, which drifts against the viewer's
 *  local "today" by the timezone offset. */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DealsTable({ deals, currentUserId }: { deals: DealRow[]; currentUserId: string }) {
  const [sort, setSort] = useState<Sort>({ key: "expectedClose", direction: "asc" });
  const [myDealsOnly, setMyDealsOnly] = useState(false);
  const [closingThisWeek, setClosingThisWeek] = useState(false);
  const [openOnly, setOpenOnly] = useState(true);

  const today = isoDate(new Date());
  const weekOut = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return isoDate(d);
  })();

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key !== key
        ? { key, direction: DEFAULT_DIRECTION[key] }
        : key === "stage"
          ? prev
          : { key, direction: prev.direction === "asc" ? "desc" : "asc" },
    );
  }

  const visible = useMemo(() => {
    return deals
      .filter((d) => !openOnly || d.status === "open")
      .filter((d) => !myDealsOnly || d.ownerId === currentUserId)
      .filter((d) => {
        if (!closingThisWeek) return true;
        return d.expectedCloseDate !== null && d.expectedCloseDate >= today && d.expectedCloseDate <= weekOut;
      })
      .sort(compareDeals(sort.key, sort.direction));
  }, [deals, openOnly, myDealsOnly, closingThisWeek, today, weekOut, sort, currentUserId]);

  const filtersActive = myDealsOnly || closingThisWeek || openOnly;

  return (
    <>
      {/* Wraps on desktop; below md there isn't room for three chips to wrap
          without pushing the table down, so they scroll sideways instead —
          fine for a row of chips in a way it isn't for a table. */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
        <FilterChip active={myDealsOnly} onClick={() => setMyDealsOnly((v) => !v)}>
          My deals
        </FilterChip>
        <FilterChip active={closingThisWeek} onClick={() => setClosingThisWeek((v) => !v)}>
          Closing this week
        </FilterChip>
        <FilterChip active={openOnly} onClick={() => setOpenOnly((v) => !v)}>
          Open only
        </FilterChip>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No deals match these filters"
          description="Nothing in the pipeline fits this combination right now."
          action={
            filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setMyDealsOnly(false);
                  setClosingThisWeek(false);
                  setOpenOnly(false);
                }}
                className="inline-flex min-h-10 items-center rounded-2xl border border-brand-200 bg-brand-50 px-4 text-sm font-medium text-brand-600 transition hover:bg-brand-100"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <Table
          columns={[
            "Title",
            "With",
            <SortHeader
              key="stage"
              label="Stage"
              active={sort.key === "stage"}
              direction={sort.direction}
              onClick={() => toggleSort("stage")}
            />,
            <SortHeader
              key="value"
              label="Value"
              active={sort.key === "value"}
              direction={sort.direction}
              onClick={() => toggleSort("value")}
            />,
            "Owner",
            <SortHeader
              key="expectedClose"
              label="Expected close"
              active={sort.key === "expectedClose"}
              direction={sort.direction}
              onClick={() => toggleSort("expectedClose")}
            />,
          ]}
        >
          {visible.map((deal, i) => (
            <Row key={deal.id} index={i} count={visible.length}>
              <RowLink href={`/deals/${deal.id}`}>{deal.title}</RowLink>

              {/* One column for both counterparties: the schema allows
                  either, and two half-empty columns would read worse than
                  one that always has something in it. */}
              <Cell muted>
                {deal.organizationName ?? deal.personName ?? <Blank />}
                {deal.organizationName && deal.personName && (
                  <span className="block text-xs text-gray-400">{deal.personName}</span>
                )}
              </Cell>

              <Cell>
                {deal.status === "open" ? (
                  <StageBadge name={deal.stageName} />
                ) : (
                  <StatusBadge status={deal.status} />
                )}
              </Cell>

              <Cell className="font-medium tabular-nums">{formatMoney(deal.value, deal.currency)}</Cell>

              <Cell muted>{deal.ownerName ?? <Blank />}</Cell>
              <Cell
                muted
                className={`tabular-nums ${isOverdue(deal, today) ? "font-semibold text-rose-600" : ""}`}
              >
                {formatDate(deal.expectedCloseDate)}
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      {visible.length > 0 && (
        <div className="space-y-3 md:hidden">
          {visible.map((deal, i) => (
            <CardLink key={deal.id} href={`/deals/${deal.id}`} index={i} count={visible.length}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{deal.title}</p>
                  <p className="mt-0.5 truncate text-sm text-gray-500">
                    {deal.organizationName ?? deal.personName ?? <Blank />}
                  </p>
                </div>
                <div className="shrink-0">
                  {deal.status === "open" ? (
                    <StageBadge name={deal.stageName} />
                  ) : (
                    <StatusBadge status={deal.status} />
                  )}
                </div>
              </div>

              <p className="mt-3 text-lg font-semibold tabular-nums text-gray-900">
                {formatMoney(deal.value, deal.currency)}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                {deal.ownerName ?? "Unassigned"}
                <span aria-hidden> · </span>
                <span className={isOverdue(deal, today) ? "font-semibold text-rose-600" : ""}>
                  {formatDate(deal.expectedCloseDate)}
                </span>
              </p>
            </CardLink>
          ))}
        </div>
      )}
    </>
  );
}

function isOverdue(deal: DealRow, today: string): boolean {
  return deal.status === "open" && deal.expectedCloseDate !== null && deal.expectedCloseDate < today;
}

function SortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const Arrow = direction === "asc" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold tracking-wide text-gray-500 uppercase transition-colors hover:text-brand-600"
    >
      {label}
      {active && <Arrow className="h-3 w-3 text-brand-500" strokeWidth={2.5} aria-hidden />}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "inline-flex min-h-9 shrink-0 items-center rounded-2xl px-4 text-sm font-medium whitespace-nowrap transition-colors " +
        (active
          ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
          : "border border-brand-200/70 bg-white text-gray-600 hover:bg-brand-100/60")
      }
    >
      {children}
    </button>
  );
}
