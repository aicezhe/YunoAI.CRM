import { describe, expect, it } from "vitest";
import { sortActivities } from "@/lib/activities-view";
import type { ActivityRow } from "@/lib/data/types";

function activity(over: Partial<ActivityRow>): ActivityRow {
  return {
    id: "a1",
    type: "call",
    priority: "normal",
    subject: "Call",
    dueAt: "2026-08-12T10:00:00Z",
    done: false,
    dealId: null,
    dealTitle: null,
    personId: null,
    personName: null,
    organizationId: null,
    organizationName: null,
    ...over,
  };
}

describe("sortActivities", () => {
  it("orders by due date, soonest first when ascending", () => {
    const rows = [
      activity({ id: "late", dueAt: "2026-09-01T09:00:00Z" }),
      activity({ id: "soon", dueAt: "2026-08-11T09:00:00Z" }),
    ];
    expect(sortActivities(rows, "asc").map((a) => a.id)).toEqual(["soon", "late"]);
    expect(sortActivities(rows, "desc").map((a) => a.id)).toEqual(["late", "soon"]);
  });

  it("keeps activities with no due date last in both directions", () => {
    // An activity with no date is not "the earliest" — reversing the sort
    // must not float it to the top.
    const rows = [
      activity({ id: "none", dueAt: null }),
      activity({ id: "soon", dueAt: "2026-08-11T09:00:00Z" }),
      activity({ id: "late", dueAt: "2026-09-01T09:00:00Z" }),
    ];
    expect(sortActivities(rows, "asc").map((a) => a.id)).toEqual(["soon", "late", "none"]);
    expect(sortActivities(rows, "desc").map((a) => a.id)).toEqual(["late", "soon", "none"]);
  });

  it("does not lift urgent work out of date order", () => {
    // The regression this exists for: urgent rows used to be pinned to the
    // top whatever the dates said, which made a sorted column read as
    // broken — "17 Aug, 11 Aug, 10 Sep" down a column with a sort arrow on
    // it. Urgency is signalled on the row, not by its position.
    const rows = [
      activity({ id: "urgent-late", dueAt: "2026-09-10T09:00:00Z", priority: "urgent" }),
      activity({ id: "normal-soon", dueAt: "2026-08-11T09:00:00Z" }),
      activity({ id: "urgent-mid", dueAt: "2026-08-17T09:00:00Z", priority: "urgent" }),
    ];
    expect(sortActivities(rows, "asc").map((a) => a.id)).toEqual([
      "normal-soon",
      "urgent-mid",
      "urgent-late",
    ]);
  });

  it("treats done and open activities the same way", () => {
    const rows = [
      activity({ id: "done-late", dueAt: "2026-09-01T09:00:00Z", done: true }),
      activity({ id: "open-soon", dueAt: "2026-08-11T09:00:00Z" }),
    ];
    expect(sortActivities(rows, "asc").map((a) => a.id)).toEqual(["open-soon", "done-late"]);
  });

  it("does not reorder the array it was given", () => {
    const input = [
      activity({ id: "b", dueAt: "2026-09-01T09:00:00Z" }),
      activity({ id: "a", dueAt: "2026-08-01T09:00:00Z" }),
    ];
    sortActivities(input, "asc");
    expect(input.map((a) => a.id)).toEqual(["b", "a"]);
  });
});
