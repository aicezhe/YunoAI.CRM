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
    expect(sortActivities(rows, "asc", false).map((a) => a.id)).toEqual(["soon", "late"]);
    expect(sortActivities(rows, "desc", false).map((a) => a.id)).toEqual(["late", "soon"]);
  });

  it("keeps activities with no due date last in both directions", () => {
    // An activity with no date is not "the earliest" — reversing the sort
    // must not float it to the top.
    const rows = [
      activity({ id: "none", dueAt: null }),
      activity({ id: "soon", dueAt: "2026-08-11T09:00:00Z" }),
      activity({ id: "late", dueAt: "2026-09-01T09:00:00Z" }),
    ];
    expect(sortActivities(rows, "asc", false).map((a) => a.id)).toEqual(["soon", "late", "none"]);
    expect(sortActivities(rows, "desc", false).map((a) => a.id)).toEqual(["late", "soon", "none"]);
  });

  it("pins urgent to the top whichever way the dates run", () => {
    const rows = [
      activity({ id: "normal-soon", dueAt: "2026-08-11T09:00:00Z" }),
      activity({ id: "urgent-late", dueAt: "2026-09-01T09:00:00Z", priority: "urgent" }),
    ];
    // The flag is a pin, not a sort key: reversing the order must not drop
    // urgent work down the page.
    expect(sortActivities(rows, "asc", true).map((a) => a.id)).toEqual([
      "urgent-late",
      "normal-soon",
    ]);
    expect(sortActivities(rows, "desc", true).map((a) => a.id)).toEqual([
      "urgent-late",
      "normal-soon",
    ]);
  });

  it("sorts within the urgent block too", () => {
    const rows = [
      activity({ id: "u-late", dueAt: "2026-09-01T09:00:00Z", priority: "urgent" }),
      activity({ id: "u-soon", dueAt: "2026-08-11T09:00:00Z", priority: "urgent" }),
      activity({ id: "normal", dueAt: "2026-08-01T09:00:00Z" }),
    ];
    expect(sortActivities(rows, "asc", true).map((a) => a.id)).toEqual([
      "u-soon",
      "u-late",
      "normal",
    ]);
  });

  it("does not pin a done activity, even if flagged urgent", () => {
    // Priority answers "what do I do next", which finished work no longer
    // has an answer to.
    const rows = [
      activity({ id: "done-urgent", dueAt: "2026-09-01T09:00:00Z", priority: "urgent", done: true }),
      activity({ id: "open-normal", dueAt: "2026-08-11T09:00:00Z" }),
    ];
    expect(sortActivities(rows, "asc", true).map((a) => a.id)).toEqual([
      "open-normal",
      "done-urgent",
    ]);
  });

  it("ignores priority entirely when pinning is off (the archive)", () => {
    const rows = [
      activity({ id: "normal-soon", dueAt: "2026-08-11T09:00:00Z" }),
      activity({ id: "urgent-late", dueAt: "2026-09-01T09:00:00Z", priority: "urgent" }),
    ];
    expect(sortActivities(rows, "asc", false).map((a) => a.id)).toEqual([
      "normal-soon",
      "urgent-late",
    ]);
  });

  it("does not reorder the array it was given", () => {
    const input = [
      activity({ id: "b", dueAt: "2026-09-01T09:00:00Z" }),
      activity({ id: "a", dueAt: "2026-08-01T09:00:00Z" }),
    ];
    sortActivities(input, "asc", false);
    expect(input.map((a) => a.id)).toEqual(["b", "a"]);
  });
});
