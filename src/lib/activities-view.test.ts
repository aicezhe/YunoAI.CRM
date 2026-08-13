import { describe, expect, it } from "vitest";
import { groupActivities, sortActivities } from "@/lib/activities-view";
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

  it("sorts without regard to priority — the pin is groupActivities' job", () => {
    const rows = [
      activity({ id: "urgent-late", dueAt: "2026-09-10T09:00:00Z", priority: "urgent" }),
      activity({ id: "normal-soon", dueAt: "2026-08-11T09:00:00Z" }),
    ];
    expect(sortActivities(rows, "asc").map((a) => a.id)).toEqual([
      "normal-soon",
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

describe("groupActivities", () => {
  const rows = () => [
    activity({ id: "urgent-late", dueAt: "2026-09-10T09:00:00Z", priority: "urgent" }),
    activity({ id: "normal-soon", dueAt: "2026-08-11T09:00:00Z" }),
    activity({ id: "urgent-soon", dueAt: "2026-08-17T09:00:00Z", priority: "urgent" }),
    activity({ id: "normal-late", dueAt: "2026-09-02T09:00:00Z" }),
  ];

  it("pins urgent above the rest, each block in date order", () => {
    const { urgent, rest } = groupActivities(rows(), "asc", true);
    expect(urgent.map((a) => a.id)).toEqual(["urgent-soon", "urgent-late"]);
    expect(rest.map((a) => a.id)).toEqual(["normal-soon", "normal-late"]);
  });

  it("flips both blocks together", () => {
    const { urgent, rest } = groupActivities(rows(), "desc", true);
    expect(urgent.map((a) => a.id)).toEqual(["urgent-late", "urgent-soon"]);
    expect(rest.map((a) => a.id)).toEqual(["normal-late", "normal-soon"]);
  });

  it("leaves one flat list when pinning is off — the archive", () => {
    const { urgent, rest } = groupActivities(rows(), "asc", false);
    expect(urgent).toEqual([]);
    expect(rest.map((a) => a.id)).toEqual([
      "normal-soon",
      "urgent-soon",
      "normal-late",
      "urgent-late",
    ]);
  });

  it("never pins a done activity, even if flagged urgent", () => {
    // Priority answers "what do I do next", which finished work no longer
    // has an answer to.
    const list = [
      activity({ id: "done-urgent", dueAt: "2026-09-01T09:00:00Z", priority: "urgent", done: true }),
      activity({ id: "open-normal", dueAt: "2026-08-11T09:00:00Z" }),
    ];
    const { urgent, rest } = groupActivities(list, "asc", true);
    expect(urgent).toEqual([]);
    expect(rest.map((a) => a.id)).toEqual(["open-normal", "done-urgent"]);
  });
});
