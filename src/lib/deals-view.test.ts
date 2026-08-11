import { describe, expect, it } from "vitest";
import type { DealRow } from "@/lib/data/types";
import {
  compareDeals,
  isOverdue,
  isoDate,
  nextSort,
  visibleDeals,
  weekOut,
  type Sort,
} from "@/lib/deals-view";

/** Only the fields the view logic reads; everything else is filler so the
 *  row typechecks. Written as a factory so each test states just the two or
 *  three values it is actually about. */
function deal(over: Partial<DealRow>): DealRow {
  return {
    id: "d1",
    title: "Deal",
    value: 1000,
    currency: "EUR",
    status: "open",
    stageId: "s1",
    stageName: "Lead",
    stagePosition: 1,
    expectedCloseDate: "2026-08-20",
    organizationId: null,
    organizationName: null,
    personId: null,
    personName: null,
    ownerId: "u1",
    ownerName: "Anna",
    lostReason: null,
    ...over,
  };
}

const BY_VALUE_DESC: Sort = { key: "value", direction: "desc" };

describe("nextSort", () => {
  it("starts a new column at its own default direction", () => {
    expect(nextSort({ key: "value", direction: "asc" }, "expectedClose")).toEqual({
      key: "expectedClose",
      direction: "asc",
    });
    expect(nextSort({ key: "expectedClose", direction: "asc" }, "value")).toEqual({
      key: "value",
      direction: "desc",
    });
  });

  it("flips the direction of the column that is already active", () => {
    expect(nextSort({ key: "value", direction: "desc" }, "value")).toEqual({
      key: "value",
      direction: "asc",
    });
  });

  it("never reverses stage — the funnel only reads one way", () => {
    const stage: Sort = { key: "stage", direction: "asc" };
    expect(nextSort(stage, "stage")).toBe(stage);
  });
});

describe("compareDeals", () => {
  it("orders by value, biggest first when descending", () => {
    const rows = [deal({ id: "a", value: 100 }), deal({ id: "b", value: 900 })];
    expect(rows.sort(compareDeals("value", "desc")).map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("keeps deals with no value last in both directions", () => {
    const rows = () => [
      deal({ id: "none", value: null }),
      deal({ id: "small", value: 1 }),
      deal({ id: "big", value: 900 }),
    ];
    expect(rows().sort(compareDeals("value", "desc")).map((d) => d.id)).toEqual([
      "big",
      "small",
      "none",
    ]);
    // The point of the rule: an unknown value is not "the smallest", so
    // reversing the sort must not float it to the top.
    expect(rows().sort(compareDeals("value", "asc")).map((d) => d.id)).toEqual([
      "small",
      "big",
      "none",
    ]);
  });

  it("keeps deals with no expected close date last in both directions", () => {
    const rows = () => [
      deal({ id: "none", expectedCloseDate: null }),
      deal({ id: "soon", expectedCloseDate: "2026-08-12" }),
      deal({ id: "later", expectedCloseDate: "2026-09-30" }),
    ];
    expect(rows().sort(compareDeals("expectedClose", "asc")).map((d) => d.id)).toEqual([
      "soon",
      "later",
      "none",
    ]);
    expect(rows().sort(compareDeals("expectedClose", "desc")).map((d) => d.id)).toEqual([
      "later",
      "soon",
      "none",
    ]);
  });

  it("sorts by stage in funnel order, with won and lost after every open deal", () => {
    const rows = [
      deal({ id: "lost", status: "lost", stagePosition: 1 }),
      deal({ id: "late-open", status: "open", stagePosition: 5 }),
      deal({ id: "won", status: "won", stagePosition: 2 }),
      deal({ id: "early-open", status: "open", stagePosition: 1 }),
    ];
    // A closed deal keeps the stage it closed in, so ranking on position
    // alone would scatter won/lost through the open rows.
    expect(rows.sort(compareDeals("stage", "asc")).map((d) => d.id)).toEqual([
      "early-open",
      "late-open",
      "won",
      "lost",
    ]);
  });

  it("puts a deal with no stage last among the open ones", () => {
    const rows = [
      deal({ id: "no-stage", stagePosition: null }),
      deal({ id: "staged", stagePosition: 3 }),
    ];
    expect(rows.sort(compareDeals("stage", "asc")).map((d) => d.id)).toEqual([
      "staged",
      "no-stage",
    ]);
  });
});

describe("visibleDeals", () => {
  const ctx = { currentUserId: "me", today: "2026-08-11", weekOut: "2026-08-18" };
  const all = [
    deal({ id: "mine-soon", ownerId: "me", expectedCloseDate: "2026-08-14" }),
    deal({ id: "theirs-soon", ownerId: "other", expectedCloseDate: "2026-08-14" }),
    deal({ id: "mine-later", ownerId: "me", expectedCloseDate: "2026-10-01" }),
    deal({ id: "mine-won", ownerId: "me", status: "won", expectedCloseDate: "2026-08-14" }),
  ];

  const NO_FILTERS = { openOnly: false, myDealsOnly: false, closingThisWeek: false };

  it("returns everything when no filter is on", () => {
    expect(visibleDeals(all, NO_FILTERS, BY_VALUE_DESC, ctx)).toHaveLength(4);
  });

  it("combines filters rather than replacing one with the next", () => {
    const visible = visibleDeals(
      all,
      { openOnly: true, myDealsOnly: true, closingThisWeek: true },
      BY_VALUE_DESC,
      ctx,
    );
    expect(visible.map((d) => d.id)).toEqual(["mine-soon"]);
  });

  it("counts today and the far edge as inside 'closing this week'", () => {
    const edges = [
      deal({ id: "today", expectedCloseDate: ctx.today }),
      deal({ id: "last-day", expectedCloseDate: ctx.weekOut }),
      deal({ id: "yesterday", expectedCloseDate: "2026-08-10" }),
      deal({ id: "day-after", expectedCloseDate: "2026-08-19" }),
    ];
    const visible = visibleDeals(edges, { ...NO_FILTERS, closingThisWeek: true }, BY_VALUE_DESC, ctx);
    expect(visible.map((d) => d.id).sort()).toEqual(["last-day", "today"]);
  });

  it("does not reorder the array it was given", () => {
    const input = [deal({ id: "a", value: 1 }), deal({ id: "b", value: 999 })];
    visibleDeals(input, NO_FILTERS, BY_VALUE_DESC, ctx);
    expect(input.map((d) => d.id)).toEqual(["a", "b"]);
  });
});

describe("isOverdue", () => {
  const today = "2026-08-11";

  it("is true only for an open deal whose date has passed", () => {
    expect(isOverdue(deal({ expectedCloseDate: "2026-08-10" }), today)).toBe(true);
    expect(isOverdue(deal({ expectedCloseDate: today }), today)).toBe(false);
    expect(isOverdue(deal({ expectedCloseDate: "2026-08-12" }), today)).toBe(false);
    expect(isOverdue(deal({ expectedCloseDate: null }), today)).toBe(false);
  });

  it("is never true for a closed deal", () => {
    // A deal won last month is not late; it is finished.
    expect(isOverdue(deal({ status: "won", expectedCloseDate: "2026-07-01" }), today)).toBe(false);
    expect(isOverdue(deal({ status: "lost", expectedCloseDate: "2026-07-01" }), today)).toBe(false);
  });
});

describe("isoDate / weekOut", () => {
  it("formats in local time, not UTC", () => {
    // 23:30 local on the 11th is already the 12th in UTC. Using toISOString
    // here would report tomorrow, and every "overdue" comparison would be a
    // day out for anyone east of Greenwich in the evening.
    expect(isoDate(new Date(2026, 7, 11, 23, 30))).toBe("2026-08-11");
  });

  it("pads single-digit months and days", () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("moves seven days on, across a month boundary", () => {
    expect(weekOut(new Date(2026, 7, 28))).toBe("2026-09-04");
  });
});
