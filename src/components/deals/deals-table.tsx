"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Handshake } from "lucide-react";
import { StageBadge, StatusBadge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/states";
import { Blank, CardLink, Cell, Row, RowLink, Table } from "@/components/ui/table";
import type { DealRow } from "@/lib/data/types";
import {
  isOverdue,
  isoDate,
  nextSort,
  visibleDeals,
  weekOut,
  type Sort,
  type SortDirection,
  type SortKey,
} from "@/lib/deals-view";
import { formatDate, formatMoney } from "@/lib/format";

export function DealsTable({ deals, currentUserId }: { deals: DealRow[]; currentUserId: string }) {
  const [sort, setSort] = useState<Sort>({ key: "expectedClose", direction: "asc" });
  const [myDealsOnly, setMyDealsOnly] = useState(false);
  const [closingThisWeek, setClosingThisWeek] = useState(false);
  const [openOnly, setOpenOnly] = useState(true);

  const today = isoDate(new Date());
  const weekEdge = weekOut(new Date());

  function toggleSort(key: SortKey) {
    setSort((prev) => nextSort(prev, key));
  }

  const visible = useMemo(
    () =>
      visibleDeals(
        deals,
        { openOnly, myDealsOnly, closingThisWeek },
        sort,
        { currentUserId, today, weekOut: weekEdge },
      ),
    [deals, openOnly, myDealsOnly, closingThisWeek, today, weekEdge, sort, currentUserId],
  );

  const filtersActive = myDealsOnly || closingThisWeek || openOnly;

  return (
    <>
      {/* Wraps on desktop; below md there isn't room for three chips to wrap
          without pushing the table down, so they scroll sideways instead —
          fine for a row of chips in a way it isn't for a table. Below md,
          the same row also carries sort pills: the desktop sort trigger
          lives in the table's own column headers, which are hidden along
          with the rest of the table at that width, so there is otherwise no
          way to sort the card list at all. */}
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

        <div className="ml-1 shrink-0 border-l border-brand-200/70 pl-3 md:hidden" aria-hidden />
        <SortPill
          label="Value"
          active={sort.key === "value"}
          direction={sort.direction}
          onClick={() => toggleSort("value")}
        />
        <SortPill
          label="Date"
          active={sort.key === "expectedClose"}
          direction={sort.direction}
          onClick={() => toggleSort("expectedClose")}
        />
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
                className="inline-flex min-h-10 items-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-medium text-brand-600 transition hover:bg-brand-100"
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

/** The card list's own sort trigger — same pill shape as FilterChip (active
 *  = filled) so the two read as one control language, plus the direction
 *  arrow SortHeader shows on desktop. md:hidden: above md the table's own
 *  column headers do this job, and a second control for the same thing
 *  would just be clutter there. */
function SortPill({
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
      aria-pressed={active}
      className={
        "inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors md:hidden " +
        (active
          ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
          : "border border-brand-200/70 bg-white text-gray-600 hover:bg-brand-100/60")
      }
    >
      {label}
      {active && <Arrow className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
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
        "inline-flex min-h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors " +
        (active
          ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
          : "border border-brand-200/70 bg-white text-gray-600 hover:bg-brand-100/60")
      }
    >
      {children}
    </button>
  );
}
